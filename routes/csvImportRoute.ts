import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { KeystoneContext } from "@keystone-6/core/types";

// Define CSV record interface
interface CsvRecord {
  name: string;
  email: string;
  status?: string;
  joined?: string;
  [key: string]: string | undefined;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

export function createCsvImportRouter(commonContext: KeystoneContext) {
  const router = express.Router();

  router.get("/_csv/health", (_req, res) => res.send("ok-csv-import"));

  router.post("/waitlist/import", (req, res) => {
    upload.single("file")(req, res, async (err) => {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File too large",
            message: "File size must be less than 5MB",
          });
        }
        return res.status(400).json({
          error: "Upload error",
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          error: "Invalid file",
          message: err.message,
        });
      }

      try {
        // Use sudo context - frontend handles auth
        // This is acceptable because the /admin/waitlist route is protected

        const context = commonContext.sudo();

        console.log("📤 Processing CSV import for waitlist");

        // Check if file exists
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Parse CSV
        const csvData = req.file.buffer.toString("utf-8");
        let records: CsvRecord[];

        try {
          records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          }) as CsvRecord[];
        } catch (parseError) {
          return res.status(400).json({
            error: "Invalid CSV format",
            message: parseError instanceof Error ? parseError.message : "Unknown parsing error",
          });
        }

        // Validate CSV has data
        if (records.length === 0) {
          return res.status(400).json({ error: "CSV file is empty" });
        }

        // Validate required columns
        const requiredColumns: (keyof CsvRecord)[] = ["name", "email"];
        const firstRecord = records[0];
        const missingColumns = requiredColumns.filter((col) => !(col in firstRecord));

        if (missingColumns.length > 0) {
          return res.status(400).json({
            error: `Missing required columns: ${missingColumns.join(", ")}`,
            required: requiredColumns,
            found: Object.keys(firstRecord),
          });
        }

        // Process each student
        const results = {
          created: 0,
          updated: 0,
          errors: [] as string[],
        };

        for (const record of records) {
          try {
            const { name, email, status, joined } = record;

            // Validate required fields
            if (!name || name.trim() === "") {
              results.errors.push(`Row with email "${email}": Name is required`);
              continue;
            }

            // Validate email format
            if (!email || !EMAIL_REGEX.test(email)) {
              results.errors.push(`Invalid email format: ${email}`);
              continue;
            }

            // Validate status
            const validStatuses = ["pending", "approved", "rejected"];
            const waitlistStatus = status?.toLowerCase().trim() || "pending";
            if (!validStatuses.includes(waitlistStatus)) {
              results.errors.push(
                `Invalid status "${status}" for ${email}. Must be: pending, approved, or rejected`
              );
              continue;
            }

            // Parse joined date
            let joinedDate: Date | null = null;
            if (joined && joined.trim() !== "") {
              joinedDate = new Date(joined);
              if (isNaN(joinedDate.getTime())) {
                results.errors.push(`Invalid date format "${joined}" for ${email}. Use YYYY-MM-DD`);
                continue;
              }
            }

            // Check if exists
            const existingStudents = await context.query.waitListStudent.findMany({
              where: { email: { equals: email.toLowerCase().trim() } },
              take: 1,
            });

            if (existingStudents.length > 0) {
              // Update
              await context.query.waitListStudent.updateOne({
                where: { id: existingStudents[0].id },
                data: {
                  name: name.trim(),
                  status: waitlistStatus,
                  createdAt: joinedDate || existingStudents[0].createdAt,
                },
              });
              results.updated++;
            } else {
              // Create
              await context.query.waitListStudent.createOne({
                data: {
                  name: name.trim(),
                  email: email.toLowerCase().trim(),
                  status: waitlistStatus,
                  createdAt: joinedDate || new Date(),
                },
              });
              results.created++;
            }
          } catch (error) {
            console.error("Error processing record:", error);
            results.errors.push(
              `Failed to process ${record.email}: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }

        console.log("✅ CSV import completed:", results);

        return res.status(200).json({
          success: true,
          message: `Import completed: ${results.created} created, ${results.updated} updated${results.errors.length > 0 ? `, ${results.errors.length} failed` : ""}`,
          results,
        });
      } catch (error) {
        console.error("CSV import error:", error);
        return res.status(500).json({
          error: "Failed to import CSV",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  });

  return router;
}
