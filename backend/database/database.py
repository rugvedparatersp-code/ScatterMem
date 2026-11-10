
import sqlite3
from pathlib import Path

# Database location
BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = BASE_DIR / "database" / "scattermem.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    # 1. Uploaded documents
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Extracted knowledge findings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS findings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            evidence TEXT,
            source_location TEXT,
            confidence TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'needs_review',
            FOREIGN KEY (document_id) REFERENCES documents(id)
        )
    """)

    # 3. Human reviews
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            finding_id INTEGER NOT NULL,
            review_status TEXT NOT NULL,
            reviewer TEXT,
            comments TEXT,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (finding_id) REFERENCES findings(id)
        )
    """)

    # 4. Pending tasks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to TEXT,
            priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Pending',
            due_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Decision DNA
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            decision TEXT NOT NULL,
            reasoning TEXT NOT NULL,
            evidence TEXT,
            impact TEXT,
            decided_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


# ==========================================
# DOCUMENT FUNCTIONS
# ==========================================

def save_document(document_id, filename, file_type):
    connection = get_connection()

    connection.execute("""
        INSERT INTO documents (id, filename, file_type)
        VALUES (?, ?, ?)
    """, (document_id, filename, file_type))

    connection.commit()
    connection.close()


def get_all_documents():
    connection = get_connection()

    rows = connection.execute("""
        SELECT * FROM documents
        ORDER BY upload_date DESC
    """).fetchall()

    connection.close()
    return [dict(row) for row in rows]


# ==========================================
# KNOWLEDGE FINDING FUNCTIONS
# ==========================================

def save_findings(document_id, findings):
    connection = get_connection()

    for finding in findings:
        connection.execute("""
            INSERT INTO findings (
                document_id, category, title, description,
                evidence, source_location, confidence, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            document_id,
            finding.get("category", "unresolved_issue"),
            finding.get("title", "Untitled finding"),
            finding.get("description", ""),
            finding.get("evidence", ""),
            finding.get("source_location", ""),
            finding.get("confidence", "medium"),
            finding.get("status", "needs_review")
        ))

    connection.commit()
    connection.close()


def get_all_findings():
    connection = get_connection()

    rows = connection.execute("""
        SELECT
            findings.*,
            documents.filename,
            COALESCE(
                (
                    SELECT reviews.review_status
                    FROM reviews
                    WHERE reviews.finding_id = findings.id
                    ORDER BY reviews.id DESC
                    LIMIT 1
                ),
                findings.status
            ) AS review_status,
            (
                SELECT reviews.reviewer
                FROM reviews
                WHERE reviews.finding_id = findings.id
                ORDER BY reviews.id DESC
                LIMIT 1
            ) AS reviewer,
            (
                SELECT reviews.comments
                FROM reviews
                WHERE reviews.finding_id = findings.id
                ORDER BY reviews.id DESC
                LIMIT 1
            ) AS review_comments
        FROM findings
        JOIN documents ON findings.document_id = documents.id
        ORDER BY findings.id DESC
    """).fetchall()

    connection.close()
    return [dict(row) for row in rows]


# ==========================================
# HUMAN REVIEW & APPROVAL FUNCTIONS
# ==========================================

def review_finding(
    finding_id,
    review_status,
    reviewer=None,
    comments=None,
    title=None,
    description=None,
    evidence=None
):
    allowed_statuses = ["Approved", "Rejected", "Needs Review"]

    if review_status not in allowed_statuses:
        raise ValueError("Invalid review status")

    connection = get_connection()

    try:
        existing = connection.execute("""
            SELECT id FROM findings WHERE id = ?
        """, (finding_id,)).fetchone()

        if not existing:
            return False

        # Update finding content only when edited values are supplied.
        connection.execute("""
            UPDATE findings
            SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                evidence = COALESCE(?, evidence),
                status = ?
            WHERE id = ?
        """, (
            title,
            description,
            evidence,
            review_status,
            finding_id
        ))

        # Keep a history of every review action.
        connection.execute("""
            INSERT INTO reviews (
                finding_id,
                review_status,
                reviewer,
                comments
            )
            VALUES (?, ?, ?, ?)
        """, (
            finding_id,
            review_status,
            reviewer,
            comments
        ))

        connection.commit()
        return True

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def get_finding_review_history(finding_id):
    connection = get_connection()

    rows = connection.execute("""
        SELECT *
        FROM reviews
        WHERE finding_id = ?
        ORDER BY reviewed_at DESC, id DESC
    """, (finding_id,)).fetchall()

    connection.close()
    return [dict(row) for row in rows]


# ==========================================
# PENDING TASK FUNCTIONS
# ==========================================

def create_task(title, description, assigned_to, priority, due_date):
    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO tasks (
            title, description, assigned_to, priority, due_date
        )
        VALUES (?, ?, ?, ?, ?)
    """, (title, description, assigned_to, priority, due_date))

    task_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return task_id


def get_all_tasks():
    connection = get_connection()

    rows = connection.execute("""
        SELECT * FROM tasks
        ORDER BY created_at DESC
    """).fetchall()

    connection.close()
    return [dict(row) for row in rows]


def update_task_status(task_id, status):
    connection = get_connection()

    cursor = connection.execute("""
        UPDATE tasks
        SET status = ?
        WHERE id = ?
    """, (status, task_id))

    connection.commit()
    updated = cursor.rowcount
    connection.close()

    return updated


def delete_task(task_id):
    connection = get_connection()

    cursor = connection.execute("""
        DELETE FROM tasks WHERE id = ?
    """, (task_id,))

    connection.commit()
    deleted = cursor.rowcount
    connection.close()

    return deleted


# ==========================================
# DECISION DNA FUNCTIONS
# ==========================================

def create_decision(
    title, decision, reasoning, evidence, impact, decided_by
):
    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO decisions (
            title, decision, reasoning, evidence, impact, decided_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        title, decision, reasoning, evidence, impact, decided_by
    ))

    decision_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return decision_id


def get_all_decisions():
    connection = get_connection()

    rows = connection.execute("""
        SELECT * FROM decisions
        ORDER BY created_at DESC
    """).fetchall()

    connection.close()
    return [dict(row) for row in rows]
