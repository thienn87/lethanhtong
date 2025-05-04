#include <iostream>
#include <cstdlib>
#include <string>

void search_in_db(const std::string& table_name, const std::string& keyword, const std::string& row_to_search, const std::string& database) {
    std::string command = "sqlite3 " + database + " \"SELECT * FROM " + table_name + " WHERE " + row_to_search + " = '" + keyword + "';\"";
    std::system(command.c_str());
}

void update_in_db(const std::string& table_name, const std::string& column_to_update, const std::string& new_value, const std::string& row_to_search, const std::string& keyword, const std::string& database) {
    std::string command = "sqlite3 " + database + " \"UPDATE " + table_name + " SET " + column_to_update + " = '" + new_value + "' WHERE " + row_to_search + " = '" + keyword + "';\"";
    std::system(command.c_str());
}

void get_from_db(const std::string& table_name, const std::string& row_to_search, const std::string& keyword, const std::string& column_to_get, const std::string& database) {
    std::string command = "sqlite3 " + database + " \"SELECT " + column_to_get + " FROM " + table_name + " WHERE " + row_to_search + " = '" + keyword + "';\"";
    std::system(command.c_str());
}

int main(int argc, char* argv[]) {
    // Kiểm tra nếu số lượng đối số ít hơn 4, yêu cầu người dùng nhập lệnh đầy đủ
    if (argc < 5) {
        std::cerr << "Cú pháp: ./databaseplusplus <đường_dẫn_csdl> search <tên_bảng> <tên_cột> <từ_khóa>" << std::endl;
        return 1;
    }

    // Kiểm tra xem người dùng có nhập đúng lệnh "search"
    std::string command = argv[2];
    std::string database = argv[1]; // Đường dẫn cơ sở dữ liệu

    // Kiểm tra lệnh và gọi hàm tương ứng
    if (command == "search") {
        if (argc != 6) {
            std::cerr << "Cú pháp: ./databaseplusplus <đường_dẫn_csdl> search <tên_bảng> <tên_cột> <từ_khóa>" << std::endl;
            return 1;
        }
        std::string table_name = argv[3];
        std::string row_to_search = argv[4];
        std::string keyword = argv[5];

        search_in_db(table_name, keyword, row_to_search, database);
    } 
    else if (command == "update") {
        if (argc != 7) {
            std::cerr << "Cú pháp: ./databaseplusplus update <đường_dẫn_csdl> <tên_bảng> <tên_cột> <giá_trị_mới> <tên_cột_tìm> <từ_khóa>" << std::endl;
            return 1;
        }
        std::string table_name = argv[3];
        std::string column_to_update = argv[4];
        std::string new_value = argv[5];
        std::string row_to_search = argv[6];
        std::string keyword = argv[7];

        update_in_db(table_name, column_to_update, new_value, row_to_search, keyword, database);
    } 
    else if (command == "get") {
        if (argc != 6) {
            std::cerr << "Cú pháp: ./databaseplusplus get <đường_dẫn_csdl> <tên_bảng> <tên_cột_tìm> <từ_khóa>" << std::endl;
            return 1;
        }
        std::string table_name = argv[3];
        std::string row_to_search = argv[4];
        std::string keyword = argv[5];
        std::string column_to_get = argv[6];

        get_from_db(table_name, row_to_search, keyword, column_to_get, database);
    }
    else {
        std::cerr << "Lệnh không hợp lệ. Vui lòng sử dụng: search, update, get" << std::endl;
        return 1;
    }

    return 0;
}
