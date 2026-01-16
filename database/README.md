# Data Model

# Document
- Id (int64)
- Guid (unique identifier)
- Name
- CategoryId (int64 Foreign Key)
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)

# DocumentVersion
- Id (int64)
- Guid (unique identifier)
- Name
- FileName
- DocumentId (int64 Foreign Key)
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)

# Category
- Id (int64)
- Name
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)


