#/bin/bash
usage="$(basename "$0") [-h] [-a api_endpoint] [-u user] [-p password] [-s space_name] [-o organization] [-n app_name] [-m install_mode] [-r optional_registers] [-x xs] -- This is a script that runs Post-Install.

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
XS_PATH="NONE"


while getopts ':ha:u:p:s:o:n:m:r:x:' option; do
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
REQUEST_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?scenario=cli&mode=${MODE}&optional=${OPTIONAL}"

################################################
echo '' > headers.txt

################################################
request_uri()
{
  URI=$1

  RESULT=$(curl -g -s -k -D headers.txt -u ${USER}:${PWD} ${URI})
  RESOURCE_STATUS=$(cat headers.txt | grep 'HTTP' | cut -d' ' -f2)
  if [ $RESOURCE_STATUS -ne 200 ]; then
    echo "Visit ${URI} failed!"
    exit 1
  fi
  rm -f headers.txt
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
else
  echo 'Post-Install run successfully!'
fi

# Delete temporary file headers.txt
rm headers.txt
exit 0

