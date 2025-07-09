CREATE TABLE `milestones` (
  `id` VARCHAR(191) NOT NULL,
  `project_id` VARCHAR(191) NOT NULL,
  `milestone_name` VARCHAR(191) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `assignee` VARCHAR(191),

  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_status` (`status`)
);
