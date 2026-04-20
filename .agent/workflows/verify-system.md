---
description: Run the Swasthya Setu System Integrity Check to ensure everything works
---

This workflow runs an automated health check on the backend APIs to verify authentication, database connectivity, and AI logic.

1. Ensure the backend server is running:
```powershell
python manage.py runserver
```

// turbo
2. Run the integrity verification task:
```powershell
python verification_task.py
```

3. View the generated report in `integrity_report.log`.
