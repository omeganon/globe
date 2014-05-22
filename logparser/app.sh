#!/bin/bash

trap "kill -- -$$" EXIT

unbuffer tail -q --follow=name --retry /var/log/hosts/p-bna-app*/current/local0 \
    | unbuffer -p awk '{print $7" "$10}' \
    | unbuffer -p sed 's/://' \
    | unbuffer -p egrep -v '^$' \
    | while read line; do
	address=`echo "${line}" | awk '{print $1}'`
	apptype=`echo "${line}" | awk '{print $2}' | tr -d '\r'`
        stuff="{\"address\":\"${address}\",\"org\":\"app\",\"type\":\"${apptype}\"}"
        echo -e "set app 0 0 ${#stuff} noreply\r\n${stuff}\r"  | nc localhost 11211
    done
