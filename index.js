const { prompt } = require("inquirer");
const mysql = require("mysql");
require("console.table");

loadMainPrompts();

async function loadMainPrompts() {
  const { choice } = await prompt([
    {
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: [
        {
          name: "View All Employees",
          value: "VIEW_EMPLOYEES"
        },
        {
          name: "Add Employee",
          value: "ADD_EMPLOYEE"
        },
        {
          name: "Remove Employee",
          value: "REMOVE_EMPLOYEE"
        },
        {
          name: "Update Employee Role",
          value: "UPDATE_EMPLOYEE_ROLE"
        },
        {
          name: "View All Roles",
          value: "VIEW_ROLES"
        },
        {
          name: "Add Role",
          value: "ADD_ROLE"
        },
        {
          name: "Remove Role",
          value: "REMOVE_ROLE"
        },
        {
          name: "View All Departments",
          value: "VIEW_DEPARTMENTS"
        },
        {
          name: "Add Department",
          value: "ADD_DEPARTMENT"
        },
        {
          name: "Remove Department",
          value: "REMOVE_DEPARTMENT"
        },
        {
          name: "Quit",
          value: "QUIT"
        }
      ]
    }
  ]);
    // Call the appropriate function depending on what the user chose
    switch (choice) {
      case "VIEW_EMPLOYEES":
        return viewEmployees();
      case "VIEW_EMPLOYEES_BY_DEPARTMENT":
        return viewEmployeesByDepartment();
      case "VIEW_EMPLOYEES_BY_MANAGER":
        return viewEmployeesByManager();
      case "ADD_EMPLOYEE":
        return addEmployee();
      case "REMOVE_EMPLOYEE":
        return removeEmployee();
      case "UPDATE_EMPLOYEE_ROLE":
        return updateEmployeeRole();
      case "VIEW_DEPARTMENTS":
        return viewDepartments();
      case "ADD_DEPARTMENT":
        return addDepartment();
      case "REMOVE_DEPARTMENT":
        return removeDepartment();
      case "VIEW_ROLES":
        return viewRoles();
      case "ADD_ROLE":
        return addRole();
      case "REMOVE_ROLE":
        return removeRole();
      default:
        return quit();
    }
  }
  
  
  const connection = mysql.createConnection({
    host: "localhost",
    // Your username
    user: "root",
    // Your password
    password: "WARNING",
    database: "employee_db"
  });

  connection.connect();

getEmployeesQuery = "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;";
getRolesQuery = "SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department on role.department_id = department.id;";
getDepartmentsQuery = "SELECT id, name FROM department;";

addEmployeeQuery = "INSERT INTO employee SET ?";
addRoleQuery = "INSERT INTO role SET ?";
addDepartmentQuery = "INSERT INTO department SET ?";

deleteEmployeeQuery = "DELETE FROM employee WHERE id = ?";
deleteRoleQuery = "DELETE FROM role WHERE id = ?";
deleteDepartmentQuery = "DELETE FROM department WHERE id = ?";

async function viewEmployees() {
  connection.query(getEmployeesQuery, function (err, employees) {
    printResults(employees);
  });
}


async function viewRoles() {
  connection.query(getRolesQuery, function (err, roles) {
    printResults(roles);
  });
}

async function viewDepartments() {
  connection.query(getDepartmentsQuery, function (err, departments) {
    printResults(departments);
  });
}

async function addEmployee() {
  const employee = await prompt([
    {
      name: "first_name",
      message: "What is the employee's first name?"
    },
    {
      name: "last_name",
      message: "What is the employee's last name?"
    }
  ]);

  connection.query(getRolesQuery, function (err, roles) {
    connection.query(getEmployeesQuery, function (err, employees) {
      const roleChoices = roles.map(({ id, title }) => ({
        name: title,
        value: id
      }));

      prompt({
        type: "list",
        name: "roleId",
        message: "What is the employee's role?",
        choices: roleChoices
      }).then((role) => {
        employee.role_id = role.roleId;

        const managerChoices = employees.map(({ id, first_name, last_name }) => ({
          name: `${first_name} ${last_name}`,
          value: id
        }));
        managerChoices.unshift({ name: "None", value: null });

        prompt({
          type: "list",
          name: "managerId",
          message: "Who is the employee's manager?",
          choices: managerChoices
        }).then((manager) => {
          employee.manager_id = manager.managerId;
          connection.query(addEmployeeQuery, employee, function (err, resp) {
            printResults(`Added ${employee.first_name} ${employee.last_name} to the database`);
          });
        });
      });
    });
  });
}

async function addRole() {
  connection.query(getDepartmentsQuery, function (err, departments) {
    const departmentChoices = departments.map(({ id, name }) => ({
      name: name,
      value: id
    }));

    prompt([
      {
        name: "title",
        message: "What is the name of the role?"
      },
      {
        name: "salary",
        message: "What is the salary of the role?"
      },
      {
        type: "list",
        name: "department_id",
        message: "Which department does the role belong to?",
        choices: departmentChoices
      }
    ]).then((role) => {
      connection.query(addRoleQuery, role, function (err, resp) {
        printResults(`Added ${role.title} to the database`);
      });
    });
  });
}

async function addDepartment() {
  const department = await prompt([
    {
      name: "name",
      message: "What is the name of the department?"
    }
  ]);

  connection.query(addDepartmentQuery, department, function (err, resp) {
    printResults(`Added ${department.name} to the database`);
  });
}

async function removeEmployee() {
  connection.query(getEmployeesQuery, function (err, employees) {
    const employeeChoices = employees.map(({ id, first_name, last_name }) => ({
      name: `${first_name} ${last_name}`,
      value: id
    }));

    prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to remove?",
        choices: employeeChoices
      }
    ]).then((employee => {
      connection.query(deleteEmployeeQuery, [employee.employeeId], function (err, res) {
        printResults("Removed employee from the database");
      });
    }));
  });
}

async function removeRole() {
  connection.query(getRolesQuery, function (err, roles) {
    const roleChoices = roles.map(({ id, title }) => ({
      name: title,
      value: id
    }));

    prompt([
      {
        type: "list",
        name: "roleId",
        message:
          "Which role do you want to remove? (Warning: This will also remove employees)",
        choices: roleChoices
      }
    ]).then((role) => {
      connection.query(deleteRoleQuery, role.roleId, function (err, resp) {
        printResults("Removed role from the database");
      });
    });
  });
}

async function removeDepartment() {
  connection.query(getDepartmentsQuery, function (err, departments) {
    const departmentChoices = departments.map(({ id, name }) => ({
      name: name,
      value: id
    }));

    prompt({
      type: "list",
      name: "departmentId",
      message:
        "Which department would you like to remove? (Warning: This will also remove associated roles and employees)",
      choices: departmentChoices
    }).then((department) => {
      connection.query(deleteDepartmentQuery, department.departmentId, function (err, resp) {
        printResults(`Removed department from the database`);
      });
    });
  });
}

async function updateEmployeeRole() {
  connection.query(getEmployeesQuery, function (err, employees) {
    const employeeChoices = employees.map(({ id, first_name, last_name }) => ({
      name: `${first_name} ${last_name}`,
      value: id
    }));

    prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee's role do you want to update?",
        choices: employeeChoices
      }
    ]).then((employee) => {
      let employeeId = employee.employeeId;
      connection.query(getRolesQuery, function (err, roles) {
        const roleChoices = roles.map(({ id, title }) => ({
          name: title,
          value: id
        }));

        prompt([
          {
            type: "list",
            name: "roleId",
            message: "Which role do you want to assign the selected employee?",
            choices: roleChoices
          }
        ]).then((role) => {
          connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [role.roleId, employeeId], function (err, resp) {
            printResults("Updated employee's role");
          });
        });
      });
    });
  });
}

function printResults(results) {
  console.log("\n");

  if (typeof (results) === 'string') {
    console.log(results);
  } else {
    console.table(results);
  }

  loadMainPrompts();
}

function quit() {
  console.log("Goodbye!");
  process.exit();
}