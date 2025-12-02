Creating a comprehensive PostgreSQL schema for a complex system as described involves multiple steps, each of which needs careful planning and implementation. Below, I will outline the necessary components and provide examples for each. Given the complexity and the lack of specific details about the tables and business logic, the examples will be somewhat generic but will serve as a solid foundation for building a complete system.

### 1. PostgreSQL Schema Creation

#### Example Tables
Let's assume we have two tables for this example: `employees` and `departments`.

```sql
-- Assuming migration script filename: V1__Initial_schema.sql

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    salary NUMERIC CHECK (salary > 0),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

### 2. Indexes for Performance

```sql
CREATE INDEX idx_employee_department ON employees(department_id);
CREATE INDEX idx_employee_last_name ON employees(last_name);
```

### 3. Foreign Key Constraints
Already included in the table creation script above.

### 4. Check Constraints
Included a check for `salary` in the `employees` table creation.

### 5. Triggers for Audit Logging

```sql
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(255),
    operation_type VARCHAR(50),
    operation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operator TEXT,
    operation_details TEXT
);

CREATE OR REPLACE FUNCTION log_employee_operations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation_type, operator, operation_details)
    VALUES ('employees', TG_OP, current_user, row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_audit
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_employee_operations();
```

### 6. Views for Common Queries

```sql
CREATE VIEW v_employees_details AS
SELECT e.employee_id, e.first_name, e.last_name, e.email, d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.department_id;
```

### 7. Stored Procedures for Complex Operations

```sql
CREATE OR REPLACE PROCEDURE transfer_employee(dept_from INT, dept_to INT, emp_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE employees SET department_id = dept_to WHERE employee_id = emp_id AND department_id = dept_from;
    COMMIT;
END;
$$;
```

### 8. Row-Level Security Policies

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_view_policy ON employees
FOR SELECT
USING (current_user = 'admin' OR department_id = current_setting('app.current_department')::INT);

CREATE POLICY employee_modify_policy ON employees
FOR ALL
USING (current_user = 'admin');
```

### 9. Partitioning Strategy for Large Tables

```sql
-- Example of range partitioning on employees based on salary
CREATE TABLE employees_partitioned (
    LIKE employees INCLUDING ALL
) PARTITION BY RANGE (salary);

CREATE TABLE employees_low_salary PARTITION OF employees_partitioned
FOR VALUES FROM (0) TO (50000);

CREATE TABLE employees_high_salary PARTITION OF employees_partitioned
FOR VALUES FROM (50000) TO (MAXVALUE);
```

### 10. Backup and Restore Procedures

```bash
# Backup
pg_dump -U username -W -F t database_name > backup.tar

# Restore
pg_restore -U username -d database_name -1 backup.tar
```

### Migration Scripts with Flyway or Liquibase

For Flyway, the SQL files are placed in the `sql` directory and named in order, e.g., `V1__Initial_schema.sql`, `V2__Add_indexes.sql`, etc.

For Liquibase, you would create an XML, JSON, or YAML changelog file detailing each change, which can be more verbose but also more flexible and powerful for complex deployments.

This setup provides a robust starting point for a production-ready PostgreSQL environment, covering a wide range of features from basic table creation to advanced security policies and partitioning.