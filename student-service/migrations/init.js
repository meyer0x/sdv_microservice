db = db.getSiblingDB("students");

// Create collection with schema validation
db.createCollection("students", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "genre", "schoolId"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        genre: {
          bsonType: "string",
          enum: ["M", "F", "Other"],
          description: "must be one of M, F, or Other and is required",
        },
        schoolId: {
          bsonType: "int",
          description: "must be an integer and is required",
        },
      },
    },
  },
});

// Create indexes
db.students.createIndex({ schoolId: 1 });
db.students.createIndex({ name: 1 });

// Insert sample data
db.students.insertMany([
  {
    name: "Jean Dupont",
    genre: "M",
    schoolId: 1,
  },
  {
    name: "Marie Martin",
    genre: "F",
    schoolId: 1,
  },
  {
    name: "Alex Smith",
    genre: "Other",
    schoolId: 2,
  },
]);
