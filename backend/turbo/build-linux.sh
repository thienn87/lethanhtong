# g++ -std=c++17 -o databaseplusplus databaseplusplus.cpp -lpthread
g++ -std=c++17 -o databaseplusplus databaseplusplus.cpp -lpthread -lsqlite3 && \
cp ./databaseplusplus ../database && cd ../ && chown -R www-data:www-data database/