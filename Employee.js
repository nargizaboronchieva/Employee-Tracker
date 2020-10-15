//========================================================================
// CODE OVERVIEW
// Create the Schema for the MySQL database. Add some seed values for testing (These are on separate sheets) 
// Build a command-line application that at a minimum allows the user to:
    // Add departments, roles, employees
    // View departments, roles, employees
    // Update employee roles
// The command line will access and update the created MYSQL database
//========================================================================

// Require Dependencies:
var mysql = require("mysql"); // For connecting to the MySQL database
var inquirer = require("inquirer"); // For interacting with the user via the command-line
var promisemysql = require("promise-mysql"); // For doing Asynchronous queries
require("console.table"); // For printing MySQL rows to the console in an attractive fashion.

// Put connection properties within an object so it can be easily used by  both mysql and promise mysql
var connectProp = {
                    host: "localhost",
                    // Your port; if not 3306
                    port: 3306,
                    // Your username
                    user: "root",
                    // Your password
                    password: "password",
                    database: "employeetracker_db"
};


// Establish Connection with MySQL:
    // create the connection information for the sql database
    var connection = mysql.createConnection(connectProp);

    // connect to the mysql server and sql database
    connection.connect(function(err) {
        if (err) throw err;
        // run the start function after the connection is made to prompt the user
        start();
    });

// Create the start function that uses inquirer to ask the user what actions he/she wants to take:
// Based off the answer, certain functions will run that perform that action.
function start() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "startOptions",
                message: "What actions do you want to take?",
                choices: [
                    "Add New Department Type",
                    "Add New Employee Role Type",
                    "Add New Employee",
                    "View all Departments",
                    "View all Employee Roles",
                    "View all Employees",
                    "Change the job of the employee",
                    "Exit program"
                ] 
            }
        ])
        .then(answers => {

            switch(answers.startOptions){

                case "Add New Department Type" :
                    addDepartment();
                    break;

                case "Add New Employee Role Type" :
                    addEmployeeRole();
                    break;
                
                case "Add New Employee" : 
                    addEmployee();
                    break;
                
                case "View all Departments" : 
                    viewDepartments();
                    break;
                
                case "View all Employee Roles" : 
                    viewEmployeeRoles();
                    break;

                case "View all Employees" : 
                    viewEmployees();
                    break;

                case "Change the job of the employee" : 
                    changeJob();
                    break;
                
                default:
                    console.log("See you later...");
                    process.exit();
            };
        });
};


// Function to add departments to the department table:
function addDepartment() {

    inquirer.prompt([
        {
            type: "input",
            name: "department",
            message: "Add Department: "
        }
    ]).then(answers=> {
        
        connection.query(
            "INSERT INTO department SET ?",
            {
              department_name: answers.department,
            },
            function(err) {
              if (err) throw err;
              console.log("New Department added successfully");
              // re-prompt the user 
              start();
            }
          );
    }); 
};


// Function to add roles to the employee_role table:
function addEmployeeRole() {
    // Create Array to hold Department Name. Real time updated list that can then be input into inquirer
    // The reason we are going to create this array is so that the Department_name question in inquirer can be created dynamically from the database. 
    let departmentName = []

    // Create connection using promiseMySQL since we will be doing some asynchronous processes
   promisemysql.createConnection(connectProp)
   .then((dbconnection) => {
       return Promise.all([

            // Return all the departments from the table department. 
            // The query will be represented by the variable department
            dbconnection.query("SELECT * FROM department"),
       ]);

   })
   .then(([department]) => {

    // Push queried employee roles into the array departmentName
    for (var i = 0; i < department.length; i++) {
        departmentName.push(department[i].department_name);
    }

    return Promise.all([department]);

    }).then(([department]) => {

            inquirer.prompt([
                {
                    type: "input",
                    name: "role",
                    message: "Add Employee Role: ",
                    validate: function(input){
                        if (input === ""){
                            console.log("Employee Role Required");
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                },
                {
                    type: "input",
                    name: "salary",
                    message: "Employee Role Salary: ",
                    validate: function(value) {
                        if (isNaN(value) === false) {
                        return true;
                        }
                        return false;
                    }
                },
                {
                    type: "list",
                    name: "department",
                    message: "Department for this Role: ",
                    choices: departmentName
                }
                
            ]).then(answers=>{

                // Set empty variable to insert the Department ID
                let departmentID;

                // Assign a department ID based on the user input choice
                for (var i = 0; i < department.length; i++) {
                    if (answers.department == department[i].department_name) {
                        departmentID = department[i].id;
                    }
                } 
                
                connection.query(
                    "INSERT INTO employee_role SET ?",
                    {
                    title: answers.role,
                    salary: answers.salary,
                    department_id: departmentID
                    },
                    function(err) {
                    if (err) throw err;
                    console.log("Employee Role added successfully");
                    // re-prompt the user 
                    start();
                    }
                );
            })
        })  
    
};


// Function to add employees to the employee table:
function addEmployee() {
    // Create Arrays to hold the Employee Roles and then another to hold Employees that can be chosen as manager.
    // The reason we are going to create these arrays is so that the Employee roles question and Manager question in inquirer can be created dynamically. 
    let employeeRole = [];
    let employees = [];

   // Create connection using promiseMySQL since we will be doing some asynchronous processes
   promisemysql.createConnection(connectProp)
   .then((dbconnection) => {
       return Promise.all([

            // Return all the employee roles from the table employee_role. 
            // The query will be represented by the variable: role
            dbconnection.query("SELECT * FROM employee_role"),
            // Return all employee first and last names from the table employee, concatenate the first_name and last_name columns, and insert into a column called fullName
            // The query will be represented by the variable: name
            dbconnection.query("SELECT employee.id, concat(employee.first_name, ' ' ,  employee.last_name) AS fullName FROM employee ORDER BY fullName ASC")

       ]);

   })
   .then(([role,name]) => {

        // Push queried employee roles into the array employeeRole
        for (var i = 0; i < role.length; i++) {
            employeeRole.push(role[i].title);
        }
        // Push queried employee names into the array employees
        for (var i = 0; i < name.length; i++) {
            employees.push(name[i].fullName)
        }

        return Promise.all([role,name]);

   })
   .then(([role,name]) => {

            // Add option for no manager
            employees.push('null')

            inquirer.prompt([
                {
                    type: "input",
                    name: "firstname",
                    message: "First Name: ",
                    validate: function(input){
                        if (input === ""){
                            console.log("First Name Required");
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                },
                {
                    type: "input",
                    name: "lastname",
                    message: "Last Name: ",
                    validate: function(input){
                        if (input === ""){
                            console.log("Last Name Required");
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                },
                {
                    type: "list",
                    name: "currentRole",
                    message: "Role within the company: ",
                    choices: employeeRole
                },
                {
                    type: "list",
                    name: "manager",
                    message: "Name of their manager: ",
                    choices: employees 
                }   
            ]).then(answers=> {

                // Set empty variable for role id
                let roleID;
                // Set default managerID as null since the managerID is optional
                let managerID = null;

                // Get the id for the particular employee role selected:
                for (var i = 0; i < role.length; i++) {
                    if (answers.currentRole == role[i].title) {
                        roleID = role[i].id;
                    }
                }

                // Get the id for the particular manager selected
                for (var i = 0; i < name.length; i++) {
                    if (answers.manager == name[i].fullName) {
                        managerID = name[i].id;
                    }
                }

                
                connection.query(
                    "INSERT INTO employee SET ?",
                    {
                    first_name: answers.firstname,
                    last_name: answers.lastname,
                    role_id: roleID,
                    manager_id: managerID
                    },
                    function(err) {
                    if (err) throw err;
                    console.log("Employee added successfully");
                    // re-prompt the user 
                    start();
                    }
                );
            });
   })   
};


// Function to view departments in the department table:
function viewDepartments() {
    connection.query("SELECT department.id, department.department_name, SUM(employee_role.salary) AS utilized_budget FROM employee LEFT JOIN employee_role on employee.role_id = employee_role.id LEFT JOIN department on employee_role.department_id = department.id GROUP BY department.id, department.department_name;", function(err, results) {
        if (err) throw err;
        console.table(results);
        start(); 
    });   
};


// Function to view roles in the employee_role table:
function viewEmployeeRoles() {
    connection.query("SELECT employee_role.id, employee_role.title, department.department_name AS department, employee_role.salary FROM employee_role LEFT JOIN department on employee_role.department_id = department.id;", function(err, results) {
        if (err) throw err;
        console.table(results);
        start(); 
    });  
};


// Function to view employees in the employees table:
function viewEmployees() {
    connection.query("SELECT employee.id, employee.first_name, employee.last_name, employee_role.title, employee_role.salary FROM employeetracker_db.employee LEFT JOIN employee_role on employee_role.id = employee.role_id", function(err, results) {
        if (err) throw err;
        console.table(results);
        start(); 
    });
};


// // Function to update employee role by changing the role_id in the employee table: 
function changeJob() {
    
    // Create Arrays to hold the Employee Roles and then another to hold Employees that can be chosen as manager
    let employeeRole = [];
    let employees = [];

   // Create connection using promiseMySQL since we will be doing some asynchronous processes
   promisemysql.createConnection(connectProp)
   .then((dbconnection) => {
       return Promise.all([

            // Return all the employee roles from the table employee_role. 
            // The query will be represented by the variable role
            dbconnection.query("SELECT * FROM employee_role"),
            // Return all employee first and last names from the table employee, concatenate the first_name and last_name columns, and insert into a column called fullName
            // The query will be represented by the variable name
            dbconnection.query("SELECT employee.id, concat(employee.first_name, ' ' ,  employee.last_name) AS fullName FROM employee ORDER BY fullName ASC")

       ]);
   })
   .then(([role,name]) => {

        // Push queried employee roles into the array employeeRole
        for (var i = 0; i < role.length; i++) {
            employeeRole.push(role[i].title);
        }
        // Push queried employee names into the array employees
        for (var i = 0; i < name.length; i++) {
            employees.push(name[i].fullName)
        }

        return Promise.all([role,name]);

   })
   .then(([role,name]) => {

            inquirer.prompt([
                {
                    type: "list",
                    name: "employeeName",
                    message: "Employee Name: ",
                    choices: employees 
                },  
                {
                    type: "list",
                    name: "currentRole",
                    message: "New Role: ",
                    choices: employeeRole
                } 
            ]).then(answers=> {

                // Set empty variable for role id
                let roleID;
                // Set empty variable for EmployeeID
                let employeeID;

                // Get the roleId for the particular employee role selected:
                for (var i = 0; i < role.length; i++) {
                    if (answers.currentRole == role[i].title) {
                        roleID = role[i].id;
                    }
                }

                // Get the id for the particular employee selected
                for (var i = 0; i < name.length; i++) {
                    if (answers.employeeName == name[i].fullName) {
                        employeeID = name[i].id;
                    }
                }

                connection.query(
                    `UPDATE employee SET role_id = ${roleID} WHERE id = ${employeeID}`,
                    function(err) {
                    if (err) throw err;
                    console.log("Employee role changed successfully");
                    // re-prompt the user 
                    start();
                    }
                );
            });
   })
};