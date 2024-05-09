#/bin/bash
usage="$(basename "$0") [-h] [-a api_endpoint] [-u user] [-p password] [-s space_name] [-o organization] [-n app_name] [-m install_mode] [-r optional_registers] [-f user_mapping_csv file] [-x xs] -- This is a script that runs Post-Install.

where:
    -h  show this help text
    -a  the xs api endpoint to connect to
    -u  set the user with which to login to the system and perform the xs operations 
    -p  set the password of the xs user
    -s  set the name of the space
    -o  set the xs organization the space belongs to
    -n  set the app name
    -m  set the mode for post install
    -r  set the array of optional registers
    -f  set the location of user mapping csv file
    -x  set the path to xs command
"

#PREPARE DEFAULT VALUES
XS_API_ENDPOINT=
USER=
PWD=
SPACE_NAME=
XS_ORG=
APP_NAME=
MODE="freshInstallation"
OPTIONAL="[]"
FILE="[]"
XS_PATH="NONE"


function readCSV() {
  file=$1
  STR="["
  while read line; do
    line=( ${line//,/ } )
    A=${line[0]}
    B=${line[1]%$'\r'}
    STR="${STR}[\"${A}\",\"${B}\"],"
  done < $file

  LEN=${#STR}-1
  if [[ ${STR:LEN:1} == ',' ]]; then
    STR=${STR:0:LEN}
  fi

  STR="${STR}]"
  echo $STR
}


while getopts ':ha:u:p:s:o:n:m:r:f:x:' option; do
  case "$option" in
    h) echo "$usage"
       exit 0
       ;;
    a) XS_API_ENDPOINT=$OPTARG
       ;;
    u) USER=$OPTARG
       ;;
    p) PWD=$OPTARG
       ;;
    s) SPACE_NAME=$OPTARG
       ;;
    o) XS_ORG=$OPTARG
       ;; 
    n) APP_NAME=$OPTARG
       ;;
    m) MODE=$OPTARG
       if [[ $MODE =~ ^(freshInstallation|upgrade)$ ]]; then
         echo "Installation mode is $MODE"
       else
         echo "Mode must be one of 'freshInstallation' or 'upgrade'!"
         exit 1
       fi
       ;;
    r) OPTIONAL=$OPTARG
       ;;
       # CSV validation
    f) FILE_PATH=$(tr '[A-Z]' '[a-z]' <<<"$OPTARG") 
       # Get and check file path
       if [ ! -f "${FILE_PATH}" ]; then
         echo "A csv file is required for user mapping."
         exit 1
       fi
       # Check file type, only .csv file is acceptable
       FILE_TYPE=${FILE_PATH##*.} 
       if [ ${FILE_TYPE} != "csv" ]; then 
         echo "Please select a .csv file for user mapping."
         exit 1
       fi
       # Get file size, the maximum allowable file size is 100M
       FILE_SIZE=`ls -l ${FILE_PATH} | awk '{ print $5 }'`
       MAX_SIZE=$((1024*1024*100))
       if [ ${FILE_SIZE} -ge ${MAX_SIZE} ]; then
         echo "The maximum allowable file size is 100M."
         exit 1
       fi
       FILE=$(readCSV $OPTARG)
       ;;
    x) XS_PATH=$OPTARG
       ;;
    \?) printf "illegal option: -%s\n" "$OPTARG" >&2
       exit 1
       ;;
  esac
done
shift "$((OPTIND - 1))"


# START SCRIPT 
if [ "$XS_PATH" == "NONE" ] ; then
  XS_PATH=`which xs | rev |cut -d'/' -f2- | rev`
fi
export PATH=$PATH:$XS_PATH

# XS login
xs login -a $XS_API_ENDPOINT -u $USER -p $PWD -o $XS_ORG -s $SPACE_NAME --skip-ssl-validation
XS_STATUS=$?
if [[ XS_STATUS -ne 0 ]]; then
  if [[ XS_STATUS -eq 127 ]]; then
    echo "Command not found: xs, please install xs client first!"
    exit 1
  else
    echo "xs login failed!"
    exit 1
  fi
fi

ENV_PARAMS=$(xs env ${APP_NAME})
if [[ $? -ne 0 ]]; then
  echo "Exception parameter: APP_NAME"
  exit 1
fi

UAA_URL=`echo "$ENV_PARAMS" | grep "uaa-security" -m1 | cut -d'"' -f4`
APP_URL=`echo "$ENV_PARAMS" | grep "application_uris" -m1 | cut -d'"' -f4`

UAA_HOST=`echo $UAA_URL | cut -d'/' -f3 | cut -d':' -f1`
APP_HOST=`echo $APP_URL | cut -d'/' -f3 | cut -d':' -f1`

UAA_LOGIN_UI_URL="${UAA_URL}/login"
UAA_LOGIN_URL="${UAA_URL}/login.do"
REQUEST_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?scenario=cli&mode=${MODE}&optional=${OPTIONAL}&file=${FILE}"

################################################
echo '' > headers.txt

# Initial login
INITIAL_LOGIN=$(curl --write-out %{http_code} --output /dev/null -i -s -k -D headers.txt  ${UAA_LOGIN_UI_URL})
if [ $INITIAL_LOGIN -ne 200 ]; then
  echo "Initial login failed!"
  exit 1
fi
# Get uas csrf token
CSRF_TOKEN=`cat headers.txt | grep -Eo 'X-Uaa-Csrf=.*?;' | cut -d'=' -f2 | cut -d';' -f1`

# Login
LOGIN=$(curl --write-out %{http_code} --output /dev/null -s -D headers.txt -k -X POST -b "X-Uaa-Csrf=${CSRF_TOKEN}" ${UAA_LOGIN_URL} -d "username=${USER}&password=${PWD}&X-Uaa-Csrf=${CSRF_TOKEN}")
if [ $LOGIN -ne 302 ]; then
  echo "Login failed!"
  echo "CSRF_TOKEN: $CSRF_TOKEN"
  exit 1
fi
# Get session ID
SESSION=$(cat headers.txt | grep 'SESSION' | cut -d';' -f1 | cut -d' ' -f2)
if [ -z "$SESSION" ]; then
  echo "SESSION is null!"
  exit 1
fi


################################################
request_uri()
{
  URI=$1

  # Visit request URL
  REQUEST=$(curl -g --write-out %{http_code} --output /dev/null -s -k -D headers.txt -b ${SESSION} ${URI})
  if [ $REQUEST -ne 302 ]; then
    echo "Visit ${URI} failed!"
    echo "SESSION: ${SESSION}"
    exit 1
  fi

  # Get relocate URL
  REQUEST_RELOCATION=`cat headers.txt | grep 'location' | cut -d' ' -f2`
  REQUEST_RELOCATION=${REQUEST_RELOCATION%$'\r'}
  # Get cookies
  REQUEST_COOKIES=`cat headers.txt | grep 'set-cookie' | cut -d':' -f2 | cut -d';' -f1`
  COOKIES="${SESSION}"
  for COOKIE in $REQUEST_COOKIES
  do
    COOKIES=";${COOKIES};$COOKIE"
  done

  # Apply for authorization code, must carry cookies
  # Example: https://<uaa-host>:<uaa-ip>/uaa-security/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>
  APPLY_FOR_AUTHORIZATION_CODE=`curl --write-out %{http_code} --output /dev/null -s -k -D headers.txt -H "Referer:${REQUEST_URL}" -b ${COOKIES} ${REQUEST_RELOCATION}`
  if [ $APPLY_FOR_AUTHORIZATION_CODE -ne 302 ]; then
    echo "Visit ${REQUEST_URL} failed!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi

  AUTHORIZATION_CODE_URL=$(cat headers.txt | grep 'location' | cut -d' ' -f2)
  AUTHORIZATION_CODE_URL=${AUTHORIZATION_CODE_URL%$'\r'}
  APPLY_FOR_AUTHORIZATION_CODE_COOKIES=`cat headers.txt | grep 'set-cookie' | cut -d':' -f2 | cut -d';' -f1`
  for COOKIE in $APPLY_FOR_AUTHORIZATION_CODE_COOKIES
  do
    COOKIES=";${COOKIES};$COOKIE"
  done

  # Example: https://<app-host>:<app-ip>/callback?code=<code>
  REQUEST_AUTHORIZATION_CODE=$(curl --write-out %{http_code} --output /dev/null -s -k -D headers.txt -H "Referer:${REQUEST_RELOCATION}" ${AUTHORIZATION_CODE_URL}  -b ${COOKIES})
  if [ $APPLY_FOR_AUTHORIZATION_CODE -ne 302 ]; then
    echo "Visit ${AUTHORIZATION_CODE_URL} failed!"
    exit 1
  fi


  # Visit original(resource) URL
  RESOURCE_URL=$(cat headers.txt | grep 'location' | cut -d' ' -f2)
  RESOURCE_URL=${RESOURCE_URL%$'\r'}
  RESOURCE_URL="${APP_URL}${RESOURCE_URL}"
  REQUEST_AUTHORIZATION_CODE_COOKIES=`cat headers.txt | grep 'set-cookie' | cut -d':' -f2 | cut -d';' -f1`
  COOKIES="${SESSION};"
  for COOKIE in $REQUEST_AUTHORIZATION_CODE_COOKIES
  do
    COOKIES="${COOKIES};$COOKIE"
  done

  RESULT=$(curl -g -s -k -b ${COOKIES} -D headers.txt -H "Referer:${AUTHORIZATION_CODE_URL}" ${RESOURCE_URL})
  RESOURCE_STATUS=$(cat headers.txt | grep 'HTTP' | cut -d' ' -f2)
  if [ $RESOURCE_STATUS -ne 200 ]; then
    echo "Visit ${RESOURCE_URL} failed!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi
}

function json_extract() {
  local key=$1
  local json=$2

  local string_regex='"([^"\]|\\.)*"'
  local number_regex='-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?'
  local value_regex="${string_regex}|${number_regex}|true|false|null"
  local pair_regex="\"${key}\"[[:space:]]*:[[:space:]]*(${value_regex})"

  if [[ ${json} =~ ${pair_regex} ]]; then
    echo $(sed 's/^"\|"$//g' <<< "${BASH_REMATCH[1]}")
  else
    return 1
  fi
}


request_uri $REQUEST_URL
TASK_ID=$(json_extract task_id "$RESULT")
REQUEST_TASK_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?info=task&id=${TASK_ID}"
STATUS="active"

while [[ $STATUS == "active" ]]
do
  request_uri $REQUEST_TASK_URL
  STATUS=$(json_extract STATUS "$RESULT" | sed 's/"//g')

  echo $STATUS

  sleep 1
done

echo "=== Final Status ===="
if [ $STATUS == 'failed' ]; then
  echo 'Post-Install run failed!'
  exit 1
elif [ $STATUS == 'complete' ]; then
  echo 'Post-Install run successfully!'
else
  echo 'Encountering an exception when running Post-Install!'
  exit 1
fi

# Delete temporary file headers.txt
rm headers.txt
exit 0

