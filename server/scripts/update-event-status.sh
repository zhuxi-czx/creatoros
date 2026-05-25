#!/bin/bash
# Auto-update event status: PUBLISHED/FULL -> ENDED when event date has passed
PGPASSWORD='Creatoros2024!' psql -h 127.0.0.1 -U creatoros creatoros -c "
  UPDATE \"Event\"
  SET \"status\" = 'ENDED', \"updatedAt\" = NOW()
  WHERE \"status\" IN ('PUBLISHED', 'FULL', 'ONGOING')
  AND \"date\" < NOW() - INTERVAL '3 hours';
"
echo "$(date): Event status updated"
