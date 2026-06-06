#!/bin/bash
# Auto-update event status: PUBLISHED/FULL/ONGOING -> ENDED when event date has passed
# DB 密码不再硬编码：从 ~/.pgpass 读取（127.0.0.1:5432:creatoros:creatoros:<密码>）
psql -h 127.0.0.1 -U creatoros creatoros -c "
  UPDATE \"Event\"
  SET \"status\" = 'ENDED', \"updatedAt\" = NOW()
  WHERE \"status\" IN ('PUBLISHED', 'FULL', 'ONGOING')
  AND \"date\" < NOW() - INTERVAL '3 hours';
"
echo "$(date): Event status updated"
