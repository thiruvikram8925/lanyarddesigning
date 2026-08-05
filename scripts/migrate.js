import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = process.env.MYSQL_PORT || 3308;

async function migrate() {
    let connection;
    try {
        console.log(`🔌 Connecting to database ${MYSQL_DATABASE} on ${MYSQL_HOST}:${MYSQL_PORT}...`);
        connection = await mysql.createConnection({
            host: MYSQL_HOST,
            port: MYSQL_PORT,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE
        });

        console.log('✅ Connected to database.');

        // 1. Projects Table Columns
        const projectCols = [
            { name: 'current_stage', type: "varchar(50) DEFAULT 'data_collected'" },
            { name: 'completed_stages', type: "longtext" },
            { name: 'pdf_url', type: "varchar(500) DEFAULT NULL" },
            { name: 'assignedTo', type: "varchar(100) DEFAULT NULL" },
            { name: 'assignedToName', type: "varchar(255) DEFAULT NULL" },
            { name: 'design_state', type: "longtext DEFAULT NULL" }
        ];

        for (const col of projectCols) {
            try {
                const [rows] = await connection.query(
                    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = ?`,
                    [MYSQL_DATABASE, col.name]
                );

                if (rows.length === 0) {
                    console.log(`➕ Adding column projects.${col.name}...`);
                    await connection.query(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Column projects.${col.name} added.`);
                }
            } catch (err) {
                console.error(`❌ Error adding column projects.${col.name}:`, err.message);
            }
        }

        // 2. Users Table Columns
        const userCols = [
            { name: 'status', type: "varchar(50) DEFAULT 'Active'" },
            { name: 'plan', type: "varchar(50) DEFAULT 'PREMIUM'" },
            { name: 'access_level', type: "varchar(100) DEFAULT 'Full Access'" },
            { name: 'trial_end_date', type: "varchar(100) DEFAULT NULL" },
            { name: 'creator_id', type: "varchar(100) DEFAULT NULL" }
        ];

        for (const col of userCols) {
            try {
                const [rows] = await connection.query(
                    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
                    [MYSQL_DATABASE, col.name]
                );

                if (rows.length === 0) {
                    console.log(`➕ Adding column users.${col.name}...`);
                    await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Column users.${col.name} added.`);
                }
            } catch (err) {
                console.error(`❌ Error adding column users.${col.name}:`, err.message);
            }
        }

        // 3. Seed / Upsert Accounts
        const usersToSeed = [
            { id: '1', name: 'Technosprint Info Solutions', email: 'itsupport@technosprint.net', password: 'Poland@01', role: 'ultra-super-admin', organization: 'Technosprint Info Solutions', status: 'Active', plan: 'PREMIUM' },
            { id: 'dd055e0a-6941-4ab5-a30e-e148438cfdcf', name: 'Super Admin', email: 'admin@gotek.com', password: 'admin123', role: 'super-admin', organization: 'GOTEK', status: 'Active', plan: 'PREMIUM' },
            { id: '69d602c23fe66f52321c75e5', name: 'sample2', email: 'sub1@gmail.com', password: 'sub11234', role: 'admin', organization: 'GOTEK', status: 'Active', plan: 'PREMIUM' },
            { id: '69d6083e7451798af0524827', name: 'Sam', email: 'user1@gmail.com', password: 'user123', role: 'user', organization: 'GOTEK', status: 'Active', plan: 'PREMIUM' },
            { id: '69d61f2f65b486ff25820c2f', name: 'Sam John', email: 'user2@gmail.com', password: 'user123', role: 'user', organization: 'AVRS', status: 'Active', plan: 'PREMIUM' },
            { id: '9a9ff277-88f2-47c1-975a-45054ed501d3', name: 'sam1', email: 'sam2@gmail.com', password: 'bank@123', role: 'user', organization: 'IDFC First Bharat Bank', status: 'Active', plan: 'PREMIUM' }
        ];

        for (const u of usersToSeed) {
            await connection.query(
                `INSERT INTO users (id, name, email, password, role, organization, status, plan, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    role = VALUES(role),
                    organization = VALUES(organization),
                    status = VALUES(status),
                    plan = VALUES(plan)`,
                [u.id, u.name, u.email, u.password, u.role, u.organization, u.status, u.plan]
            );
        }
        console.log('✅ User accounts migrated successfully.');

        await connection.query(`UPDATE projects SET completed_stages = '[]' WHERE completed_stages IS NULL`);
        console.log('🚀 Migration complete.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();

