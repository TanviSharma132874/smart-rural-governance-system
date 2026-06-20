const { query, validationResult } = require("express-validator");
const { getComplaintsValidator } = require("./validators/complaintValidators");

// Mocking express-validator's behavior
async function testValidation() {
  console.log("--- Testing getComplaintsValidator with empty strings ---");

  // Mock request with empty strings (falsy values)
  const req = {
    query: {
      status: "",
      priority: "",
      category: "",
      responsibleDepartment: "",
      search: "",
    }
  };

  // Run validators
  await Promise.all(getComplaintsValidator.map(validator => validator.run(req)));

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    console.log("PASS: No validation errors with empty strings.");
  } else {
    console.log("FAIL: Validation errors found:");
    console.log(JSON.stringify(errors.array(), null, 2));
  }

  // Verify that actual invalid values still fail
  const reqInvalid = {
    query: {
      status: "InvalidStatus",
    }
  };

  await Promise.all(getComplaintsValidator.map(validator => validator.run(reqInvalid)));
  const errorsInvalid = validationResult(reqInvalid);

  if (!errorsInvalid.isEmpty()) {
    console.log("PASS: Invalid status correctly caught.");
  } else {
    console.log("FAIL: Invalid status was ignored.");
  }
}

testValidation();
