# !/bin/bash

organisation="orion"
image_name="jurisaide-benin-api"
registry_host="$1"
version="1"

function check (){
    RESULT=$?
    if [ $RESULT == 0 ]; then
        echo ""
        echo "[$1] SUCCESS"
        echo ""
        return $RESULT
    else
        echo ""
        echo "[$1] FAIL: $RESULT"
        echo ""
        exit $RESULT
    fi
}



echo $registry_host

echo "Tagging image $image_name by $organisation with registry $registry_host"
docker tag $organisation/$image_name:$version $registry_host/$organisation/$image_name:$version
check "tag"

echo "Publishing image $registry_host/$organisation/$image_name to registry $registry_host"
docker push $registry_host/$organisation/$image_name:$version
check "push"

echo "Image $registry_host/$organisation/$image_name:$version published!"
