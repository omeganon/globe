#!/bin/bash

trap "kill -- -$$" EXIT

tail -q --follow=name --retry /var/log/hosts/p-bna-tracker0*/current/apache2-access.log \
    | egrep -iv ' 10\.|"Ruby"|status|Pingdom|GET /optout|HEAD' \
    | awk '{print $5" "$12}' \
    | awk -F/ '{print $1" "$2}' \
    | egrep 'track|click|/optout|webview|sendtofriend|message' \
    | while read line; do
        address=`echo "${line}" | awk '{print $1}'`
        type=`echo "${line}" | awk '{print $2}'`
        stuff="{\"address\":\"${address}\",\"org\":\"tracker\",\"type\":\"${type}\"}"
        echo -e "set tracker 0 0 ${#stuff} noreply\r\n${stuff}\r" | nc localhost 11211
    done
