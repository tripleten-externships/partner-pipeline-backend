// Run while backend is running:  node scripts/seedFull.http.mjs
const ENDPOINT = process.env.GQL || 'http://localhost:8080/api/graphql';

//These credentials should match whatever user you created for the localhost:8080 Admin UI
//If you haven't created one yet, do so now - and then uncomment the fields in the access.ts file
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'localhost8080@email.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'localhost8080pw';


async function gql(query, vars = {}, cookie = '') {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ query, variables: vars }),
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { throw new Error(`Bad JSON: ${txt}`); }
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return { data: json.data, setCookie: res.headers.get('set-cookie') || '' };
}

async function login() {
  const m = `mutation($e:String!,$p:String!){
    authenticateUserWithPassword(email:$e,password:$p){
      __typename
      ... on UserAuthenticationWithPasswordSuccess{ sessionToken item{id email} }
      ... on UserAuthenticationWithPasswordFailure{ message }
    }}`;
  const { data, setCookie } = await gql(m, { e: ADMIN_EMAIL, p: ADMIN_PASSWORD });
  const res = data.authenticateUserWithPassword;
  if (res.__typename.includes('Failure')) throw new Error(res.message);
  console.log('🔐 Logged in as', res.item.email);
  return setCookie || `keystonejs-session=${res.sessionToken}`;
}

async function getOne(q, vars, cookie, path) {
  const { data } = await gql(q, vars, cookie);
  return path.split('.').reduce((a, k) => (a ? a[k] : undefined), data);
}

// ---------- helpers ----------
async function ensureProject(cookie, p) {
  const q = `query($n:String!){ projects(where:{name:{equals:$n}}, take:1){ id name } }`;
  const found = await getOne(q, { n: p.name }, cookie, 'projects');
  if (found && found.length) return found[0];
  const m = `mutation($d:ProjectCreateInput!){ createProject(data:$d){ id name } }`;
  const { data } = await gql(
    m,
    { d: { ...p, project: p.project || p.name.replace(/\s+/g, '-').toLowerCase() } },
    cookie
  );
  return data.createProject;
}

async function ensureUser(cookie, u) {
  const q = `query($e:String!){ users(where:{email:{equals:$e}}, take:1){ id email } }`;
  const found = await getOne(q, { e: u.email }, cookie, 'users');
  if (found && found.length) return found[0];
  const m = `mutation($d:UserCreateInput!){ createUser(data:$d){ id email name } }`;
  const { data } = await gql(
    m,
    { d: { ...u, project: u.project || 'default-project' } },
    cookie
  );
  return data.createUser;
}

async function ensureMilestone(cookie, projectId, name, dataPart) {
  const q = `query($n:String!,$pid:ID!){
    milestones(where:{ milestoneName:{equals:$n}, project:{ id:{ equals:$pid } } }, take:1){
      id milestoneName
    }
  }`;
  const found = await getOne(q, { n: name, pid: projectId }, cookie, 'milestones');
  if (found && found.length) return found[0];

  const m = `mutation($d:MilestoneCreateInput!){ createMilestone(data:$d){ id milestoneName status } }`;
  const { data } = await gql(
    m,
    {
      d: {
        project: { connect: { id: projectId } },
        milestoneName: name,
        ...dataPart,
      },
    },
    cookie
  );
  return data.createMilestone;
}

async function ensureProjectInvitation(cookie, { email, projectId, userId }) {
  const q = `query($e:String!,$pid:ID!){
    projectInvitations(where:{ email:{equals:$e}, project:{ id:{ equals:$pid } } }, take:1){
      id email
    }
  }`;
  const found = await getOne(q, { e: email, pid: projectId }, cookie, 'projectInvitations');
  if (found && found.length) return found[0];
  const m = `mutation($d:ProjectInvitationCreateInput!){
    createProjectInvitation(data:$d){ id email }
  }`;
  const { data } = await gql(
    m,
    {
      d: {
        email,
        project: { connect: { id: projectId } },
        ...(userId ? { user: { connect: { id: userId } } } : {}),
      },
    },
    cookie
  );
  return data.createProjectInvitation;
}

async function createActivity(cookie, projectId, milestoneId, userId, oldS, newS) {
  const m = `mutation($d:ActivityLogCreateInput!){ createActivityLog(data:$d){ id } }`;
  await gql(
    m,
    {
      d: {
        project: { connect: { id: projectId } },
        milestone: { connect: { id: milestoneId } },
        updatedBy: { connect: { id: userId } },
        oldStatus: oldS,
        newStatus: newS,
        timestamp: new Date().toISOString(),
      },
    },
    cookie
  );
}

async function ensureInvitationToken(cookie, { invitationId, tokenHash, role, opts = {} }) {
  // 1) Check if a token with this hash already exists
  const q = `query($h:String!){
    invitationTokens(where:{ tokenHash:{ equals:$h } }, take:1){ id }
  }`;
  const existing = await getOne(q, { h: tokenHash }, cookie, 'invitationTokens');

  const expiresAt = new Date(Date.now() + (opts.days ?? 7) * 86400000).toISOString();
  const data = {
    // relationship to ProjectInvitation is called "project" in your model
    project: { connect: { id: invitationId } },
    roleToGrant: role,
    expiresAt,
    maxUses: opts.maxUses ?? 5,
    usedCount: opts.usedCount ?? 0,
    revoked: opts.revoked ?? false,
    notes: opts.notes ?? null,
  };

  if (existing && existing.length) {
    // 2) Update it in case you changed role/expiry/etc.
    const mUpdate = `mutation($id:ID!,$d:InvitationTokenUpdateInput!){
      updateInvitationToken(where:{ id:$id }, data:$d){ id }
    }`;
    await gql(mUpdate, { id: existing[0].id, d: data }, cookie);
    return existing[0];
  }

  // 3) Create if not found
  const mCreate = `mutation($d:InvitationTokenCreateInput!){
    createInvitationToken(data:$d){ id }
  }`;
  await gql(mCreate, { d: { tokenHash, ...data } }, cookie);
}

// ---------- main ----------
(async () => {
  console.log('🌱 Seeding via HTTP…');
  const cookie = await login();

  // Users
  const kate   = await ensureUser(cookie, { name:'Dr. Kate Mangubat', email:'kate@example.com',   password:'password123', role:'Lead Mentor',   isAdmin:true,  isActive:true,  project:'partner-pipeline-platform' });
  const andrew = await ensureUser(cookie, { name:'Andrew Thomas',      email:'andrew@example.com', password:'password123', role:'Project Mentor', isAdmin:false, isActive:true,  project:'partner-pipeline-platform' });
  const vic    = await ensureUser(cookie, { name:'Victor Perez',      email:'victor@example.com',    password:'password123', role:'Student',        isAdmin:false, isActive:true,  project:'partner-pipeline-platform' });
  const divya  = await ensureUser(cookie, { name:'Divya Patel',        email:'divya@example.com',  password:'password123', role:'Student',        isAdmin:false, isActive:true,  project:'mentor-dashboard-revamp' });
  console.log('✅ Users ready');

  // Projects
  const projA = await ensureProject(cookie, {
    name: 'Partner Pipeline Platform',
    project: 'partner-pipeline-platform',
    isActive: true,
    lastUpdate: new Date().toISOString(),
    members: { connect: [{ id: kate.id }, { id: andrew.id }, { id: vic.id }, { id: divya.id }] },
  });
  const projB = await ensureProject(cookie, {
    name: 'Mentor Dashboard Revamp',
    project: 'mentor-dashboard-revamp',
    isActive: true,
    lastUpdate: new Date().toISOString(),
    members: { connect: [{ id: kate.id }, { id: andrew.id }] },
  });
  console.log('✅ Projects ready');

  // Milestones (using correct enum values)
  const mA1 = await ensureMilestone(cookie, projA.id, 'Setup Keystone Backend', {
    status: 'completed',
    assignee: andrew.name,
    updatedBy: { connect: { id: andrew.id } },
  });
  const mA2 = await ensureMilestone(cookie, projA.id, 'Integrate Frontend & GraphQL', {
    status: 'in_progress',
    assignee: vic.name,
    updatedBy: { connect: { id: vic.id } },
  });
  const mB1 = await ensureMilestone(cookie, projB.id, 'UI Design Prototype', {
    status: 'not_started',
    assignee: divya.name,
    updatedBy: { connect: { id: kate.id } },
  });
  console.log('✅ Milestones ready');

  await createActivity(cookie, projA.id, mA1.id, andrew.id, 'not_started', 'completed');
  await createActivity(cookie, projA.id, mA2.id, vic.id,    'not_started', 'in_progress');
  console.log('✅ Activity logs added');

  const invA = await ensureProjectInvitation(cookie, { email:'invite+students@example.com', projectId:projA.id, userId:kate.id });
  const invB = await ensureProjectInvitation(cookie, { email:'invite+mentors@example.com',  projectId:projB.id, userId:andrew.id });
  await ensureInvitationToken(cookie, { invitationId: invA.id, tokenHash: 'demo-hash-student', role: 'Student',        opts: { days:7,  maxUses:5, notes:'Student invite' } });
  await ensureInvitationToken(cookie, { invitationId: invB.id, tokenHash: 'demo-hash-mentor',  role: 'Project Mentor', opts: { days:14, maxUses:2, notes:'Mentor invite' } });

  console.log('✅ Invitation tokens created');
  console.log('🌟 All done! Data is live in Admin UI.');
})().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
