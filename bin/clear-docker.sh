docker rm -vf $(docker ps -a -q) && docker rmi -f $(docker images -a -q) && docker container prune && docker volume prune && docker images prune
