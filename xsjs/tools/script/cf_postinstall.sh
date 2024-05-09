#/bin/bash
usage="$(basename "$0") [-h]  [-u user] [-p password] [-s uaa_url] [-a app_url] [-m install_mode] [-r optional_registers] -- This is a script that runs Post-Install on Cloud Foundry.

where:
    -h  show this help text
    -u  set the user on cf
    -p  set the password of the cf user
    -a  set the application url
    -s  set the uaa url
    -m  set the mode for post install
    -r  set the array of optional registers
"

#PREPARE DEFAULT VALUES
USERNAME=
PASSWORD=
APP_URL=
UAA_URL=
MODE="freshInstallation"
OPTIONAL="[]"

while getopts ':ha:u:p:s:a:m:r:' option; do
  case "$option" in
    h) echo "$usage"
       exit 0
       ;;
    a) APP_URL=$OPTARG
       ;;
    u) USERNAME=$OPTARG
       ;;
    p) PASSWORD=$OPTARG
       ;;
    s) UAA_URL=$OPTARG
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
    \?) printf "illegal option: -%s\n" "$OPTARG" >&2
       exit 1
       ;;
  esac
done
shift "$((OPTIND - 1))"



### Clean up
################################################
echo '' > headers.txt
COOKIES=""
RESULT=""
################################################



### Function
################################################
urldecode() { : "${*//+/ }"; echo "${_//%/\\x}"; }

urlformat() {
    URL=$1
    LEN=${#URL}
    [[ "${URL: -1}" == "/" ]] && urlformat ${URL: 0: LEN-1} || echo $URL
}

json_extract() {
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

initial_request() {
  URI=$1

  # e.g. https://plc-dmo.cfapps.sap.hana.ondemand.com/postinstall/index.html
  REQUEST=$(curl -g --write-out %{http_code} --output /dev/null -s -k -D headers.txt ${URI})
  if [ $REQUEST -ne 302 ]; then
    echo "Unexpected result: ${URI} $REQUEST!"
    exit 1
  fi
  LOCATION=`cat headers.txt | grep 'Location:' | cut -d' ' -f2`
  # LOCATION=$(urldecode $LOCATION)
  LOCATION=${LOCATION%$'\r'}

  # e.g. https://plc.authentication.sap.hana.ondemand.com/oauth/authorize?response_type=code&client_id=sb-xsac-plc-dmo!t1248&redirect_uri=https%3A%2F%2Fplc-dmo.cfapps.sap.hana.ondemand.com%2Flogin%2Fcallback
  REQUEST=$(curl --write-out %{http_code} --output /dev/null -D headers.txt -s -k -D headers.txt ${LOCATION})
  if [ $REQUEST -ne 302 ]; then
    echo "Unexpected result: ${LOCATION} $REQUEST!"
    exit 1
  fi
  LOCATION=`cat headers.txt | grep 'Location:' | cut -d' ' -f2`
  # Get UAA csrf token
  CSRF_TOKEN=`cat headers.txt | grep -Eo 'X-Uaa-Csrf=.*?;' | cut -d'=' -f2 | cut -d';' -f1`
  REQUEST_COOKIES=`cat headers.txt | grep 'Set-Cookie' | cut -d':' -f2 | cut -d';' -f1`
  for COOKIE in $REQUEST_COOKIES
  do
    COOKIES=";${COOKIES};$COOKIE"
  done

  # Login
  # e.g. https://plc.authentication.sap.hana.ondemand.com/login.do
  LOGIN=$(curl --write-out %{http_code} --output /dev/null -s -D headers.txt -k -X POST -b "X-Uaa-Csrf=${CSRF_TOKEN}" ${UAA_LOGIN_URL} -d "username=${USERNAME}&password=${PASSWORD}&X-Uaa-Csrf=${CSRF_TOKEN}")
  if [ $LOGIN -ne 302 ]; then
    echo "Login failed!"
    echo "CSRF_TOKEN: $CSRF_TOKEN"
    exit 1
  fi
  REQUEST_COOKIES=`cat headers.txt | grep 'Set-Cookie' | cut -d':' -f2 | cut -d';' -f1`
  COOKIES=""
  for COOKIE in $REQUEST_COOKIES
  do
    COOKIES=";${COOKIES};$COOKIE"
  done

  # Visit request URL
  REQUEST=$(curl -g --write-out %{http_code} --output /dev/null -s -k -D headers.txt -b ${COOKIES} ${URI})
  if [ $REQUEST -ne 302 ]; then
    echo "Unexpected result: ${URI} $REQUEST!"
    exit 1
  fi
  LOCATION=`cat headers.txt | grep 'Location:' | cut -d' ' -f2`
  # LOCATION=$(urldecode $LOCATION)
  LOCATION=${LOCATION%$'\r'}
  REQUEST_COOKIES=`cat headers.txt | grep 'Set-Cookie' | cut -d':' -f2 | cut -d';' -f1`
  for COOKIE in $REQUEST_COOKIES
  do
    COOKIES=";${COOKIES};$COOKIE"
  done

  # Apply for authorization code, must carry cookies
  # e.g. https://<uaa-host>:<uaa-ip>/uaa-security/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>
  REQUEST=$(curl --write-out %{http_code} --output /dev/null -s -k -D headers.txt -H "Referer:${REQUEST_URL}" -b ${COOKIES} ${LOCATION})
  if [ $REQUEST -ne 302 ]; then
    echo "Unexpected result: ${LOCATION} $REQUEST!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi
  AUTHORIZATION_CODE_URL=$(cat headers.txt | grep 'Location:' | cut -d' ' -f2)
  AUTHORIZATION_CODE_URL=${AUTHORIZATION_CODE_URL%$'\r'}
  echo "AUTHORIZATION_CODE_URL: $AUTHORIZATION_CODE_URL"


  # e.g. https://<app-host>:<app-ip>/callback?code=<code>
  REQUEST=$(curl --write-out %{http_code} --output /dev/null -s -k -D headers.txt -H "Referer:${REQUEST_RELOCATION}" -b ${COOKIES}  ${AUTHORIZATION_CODE_URL} )
  if [ $REQUEST -ne 302 ]; then
    echo "Visit ${AUTHORIZATION_CODE_URL} failed!"
    echo "Unexpected result: ${AUTHORIZATION_CODE_URL} $REQUEST!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi

  # Visit original(resource) URL
  Location=$(cat headers.txt | grep 'Location:' | cut -d' ' -f2)
  Location=${Location%$'\r'}
  Location="${APP_URL}${Location}"
  REQUEST_COOKIES=`cat headers.txt | grep 'Set-Cookie:' | cut -d':' -f2 | cut -d';' -f1`
  COOKIES=""
  for COOKIE in $REQUEST_COOKIES
  do
    COOKIES="${COOKIES};$COOKIE"
  done

  echo '' > headers.txt
  RESULT=$(curl -g -s -k -b ${COOKIES} -D headers.txt -H "Referer:${AUTHORIZATION_CODE_URL}" ${Location})
  RESOURCE_STATUS=$(cat headers.txt | grep 'OK' | cut -d' ' -f2)
  if [ $RESOURCE_STATUS -ne 200 ]; then
    echo "Visit ${Location} failed!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi

  #echo $RESULT
}

request() {
  URI=$1
  RESULT=$(curl -g -s -k -b ${COOKIES} -D headers.txt ${URI})
  RESOURCE_STATUS=$(cat headers.txt | grep 'OK' | cut -d' ' -f2)
  if [ $RESOURCE_STATUS -ne 200 ]; then
    echo "Visit ${URI} failed!"
    echo "Cookies: ${COOKIES}"
    exit 1
  fi
  #echo $RESULT
}
################################################




### Configuration
################################################
UAA_URL=$(urlformat $UAA_URL)
APP_URL=$(urlformat $APP_URL)
UAA_LOGIN_URL="${UAA_URL}/login.do"
REQUEST_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?scenario=cli&mode=${MODE}&optional=${OPTIONAL}"

echo $REQUEST_URL
################################################





### Call
################################################
initial_request $REQUEST_URL
TASK_ID=$(json_extract task_id "$RESULT")

REQUEST_TASK_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?info=task&id=${TASK_ID}"
STATUS="active"

while [ "$STATUS" == "active" ]
do
  request $REQUEST_TASK_URL
  STATUS=$(json_extract STATUS "$RESULT")

  echo "$STATUS"

  sleep 1
done

echo "=== Final Status ===="
if [ "$STATUS" == "failed" ]; then
  echo 'Post-Install run failed!'
  exit 1
elif [ "$STATUS" == "complete" ]; then
  echo 'Post-Install run successfully!'
else
  echo 'Encountering an exception when running Post-Install!'
  echo 'Refer to table "t_task" for error details!'
  exit 1
fi

# Delete temporary file headers.txt, urldecode
rm headers.txt
exit 0
################################################
