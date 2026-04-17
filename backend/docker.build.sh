# !/bin/bash

organisation="orion"
image_name="jurisaide-benin-api"
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

echo "Building image $image_name by $organisation"
docker build --no-cache -t $organisation/$image_name:$version -f ./Dockerfile .
check "build"

echo "Image $organisation/$image_name:$version built!"
