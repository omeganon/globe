#!/bin/bash

trap "kill -- -$$" EXIT

unbuffer tail -q --follow=name --retry /var/log/hosts/p-bna-tracker0*/current/apache2-access.log \
    | unbuffer -p awk '$12 ~ /\/(signup|cshare|sendtofriend|optout|share|message|webview|click|track)/ { print $22" "$12}' \
    | unbuffer -p sed 's/,.*"//' \
    | unbuffer -p sed 's/"//g' \
    | unbuffer -p sed 's/POST \/signup\/optout/POST \/optout/' \
    | unbuffer -p awk -F/ '{print $1" "$2}' \
    | unbuffer -p egrep 'track|click|optout|webview|sendtofriend|message' \
    | while read line; do
        address=`echo "${line}" | awk '{print $1}'`
        mytype=`echo "${line}" | awk '{print $2}' | tr -d '\r'`
        stuff="{\"address\":\"${address}\",\"org\":\"tracker\",\"type\":\"${mytype}\"}"
        echo -e "set tracker 0 0 ${#stuff} noreply\r\n${stuff}\r" | nc localhost 11211
    done
