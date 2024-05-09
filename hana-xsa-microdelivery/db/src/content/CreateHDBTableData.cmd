@echo off

echo {> import.hdbtabledata
echo     "format_version": 1,>> import.hdbtabledata
echo     "imports": [>> import.hdbtabledata

for %%i in (*.csv) do (
  echo         {>> import.hdbtabledata
  echo             "target_table": "sap.plc.db::basis.%%~ni",>> import.hdbtabledata
  echo             "source_data": {>> import.hdbtabledata
  echo                 "data_type": "CSV",>> import.hdbtabledata
  echo                 "file_name": "sap.plc.db.content::%%i",>> import.hdbtabledata
  echo                 "has_header": true>> import.hdbtabledata
  echo             }>> import.hdbtabledata
  echo         },>> import.hdbtabledata
)
echo     ]>> import.hdbtabledata
echo }>> import.hdbtabledata

echo.
echo.
echo IMPORTANT:
echo Please make sure to remove the last comma in the imports list to create a valid json file!
echo.
pause