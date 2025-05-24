# Constants for the firmware

# Port to connect to the software Next.js server
SERVER_PORT = 3000

# Number of items to batch together when connected to the server and streaming.
# Should be minimised to reduce the chance of data loss in the event of a power loss.
STREAMING_BATCH_SIZE = 80

# Number of items to batch together when clearing a backlog of previously measured data.
BACKLOG_BATCH_SIZE = 80

# Cooldown period between connection attempts (in seconds)
SERVER_CONNECT_COOLDOWN_SEC = 8
