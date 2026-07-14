from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI()

clients = []


html = """
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Chat</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

</head>

<body class="bg-light">

<div class="container mt-5">

    <div class="card shadow">

        <div class="card-header text-center">
            <h3>FastAPI Chat Room</h3>
        </div>

        <div class="card-body">

            <div id="messages"
                 class="border rounded p-3 mb-3"
                 style="height:350px;overflow-y:auto;background:white;">
            </div>

            <div class="input-group">

                <input
                    id="messageInput"
                    class="form-control"
                    placeholder="Type message">

                <button
                    class="btn btn-primary"
                    onclick="sendMessage()">
                    Send
                </button>

            </div>

        </div>

    </div>

</div>


<script>

const ws = new WebSocket("ws://" + location.host + "/ws");

const messages = document.getElementById("messages");

ws.onmessage = function(event){

    messages.innerHTML +=
    `<div class="alert alert-secondary py-1 mb-2">
        ${event.data}
    </div>`;

    messages.scrollTop = messages.scrollHeight;
};


function sendMessage(){

    const input = document.getElementById("messageInput");

    if(input.value.trim() === "")
        return;

    ws.send(input.value);

    input.value="";
}


document.getElementById("messageInput")
.addEventListener("keypress",function(e){

    if(e.key==="Enter")
        sendMessage();

});

</script>

</body>
</html>
"""


@app.get("/")
async def home():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    clients.append(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            for client in clients:
                await client.send_text(data)

    except WebSocketDisconnect:

        clients.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)