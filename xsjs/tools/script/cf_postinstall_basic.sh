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

request() {
  URI=$1

  echo '' > headers.txt
  RESULT=$(curl -g -s -k -D headers.txt -u ${USERNAME}:${PASSWORD} ${URI})
  RESOURCE_STATUS=$(cat headers.txt | grep 'OK' | cut -d' ' -f2)
  if [ "$RESOURCE_STATUS" != "200" ]; then
    echo "Visit ${URI} failed!"
    exit 1
  fi
  rm -f headers.txt

  #echo $RESULT
}

################################################




### Configuration
################################################
APP_URL=$(urlformat $APP_URL)
REQUEST_URL="${APP_URL}/sap/plc/xs/postinstall/rest/run.xsjs?scenario=cli&mode=${MODE}&optional=${OPTIONAL}"

echo $REQUEST_URL
################################################





### Call
################################################
request $REQUEST_URL
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
  exit 1
fi

# Delete temporary file headers.txt, urldecode
rm -f headers.txt
exit 0
################################################
