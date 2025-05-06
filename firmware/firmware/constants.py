# Number of items to batch together when connected to the server and streaming.
# Should be minimised to reduce the chance of data loss in the event of a power loss.
STREAMING_BATCH_SIZE = 10

# Number of items to batch together when clearing a backlog of previously measured data.
BACKLOG_BATCH_SIZE = 125

# Cooldown period between connection attempts (in seconds)
SERVER_CONNECT_COOLDOWN_SEC = 10
