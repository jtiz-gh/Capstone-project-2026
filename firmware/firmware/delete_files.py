from drivers import flash_storage

if __name__ == "__main__":
    success = flash_storage.delete_measurements(99999)
    if success:
        print("Successfully deleted measurements.")
    else:
        print("Failed to delete measurements.")
