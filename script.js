let cubeRotation = 0.0;

function loadText(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if(xhr.status === 200)
        return xhr.responseText;
    else
        return null;
}

let gl,
    buffers,
    positionBuffer,
    programInfo,
    translation = [0.0, 0.0, -6.0],
    rotation = [0.3, 0.3, 0.0],
    fov = 45,
    zoom = 1.0;
const
    projectionMatrix = mat4.create(),
    modelViewMatrix = mat4.create();
const positions = [
    //Front
    -1.0, -1.0, 1.0,
     1.0, -1.0, 1.0,
     1.0,  1.0, 1.0,
    -1.0,  1.0, 1.0,
    //Back
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    //Top
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    //Bottom
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    //Right
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,
    //Left
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];

function main() {
    //InitContext
    const canvas = document.querySelector('#dawin-webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('ERREUR : echec chargement du contexte');
        return;
    }

    //InitShaders
    const shaderProgram = initShaders(gl, loadText("vertex.glsl"), loadText("fragment.glsl"));

    //InitAttributes
    programInfo = {
        program: shaderProgram,
        position: gl.getAttribLocation(shaderProgram, 'position'),
        color: gl.getAttribLocation(shaderProgram, 'color'),
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'projectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'modelViewMatrix')
    };

    //InitBuffers
    buffers = initBuffers(gl);
    initEvents();
    drawScene();
}

function initBuffers(gl) {
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front: white
        [1.0, 0.0, 0.0, 1.0], // Back: red
        [0.0, 1.0, 0.0, 1.0], // Top: green
        [0.0, 0.0, 1.0, 1.0], // Bottom: blue
        [1.0, 1.0, 0.0, 1.0], // Right: yellow
        [1.0, 0.0, 1.0, 1.0], // Left: purple
    ];
    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
        0,  1,  2,  0,  2,  3,  // Front
        4,  5,  6,  4,  6,  7,  // Back
        8,  9,  10, 8,  10, 11, // Top
        12, 13, 14, 12, 14, 15, // Bottom
        16, 17, 18, 16, 18, 19, // Right
        20, 21, 22, 20, 22, 23, // Left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

function initShaders(gl, vsSource, fsSource) {
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, loadShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(shaderProgram, loadShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function drawScene() {
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(projectionMatrix,
        fov * Math.PI / 180,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.1,
        100.0);

    mat4.fromTranslation(modelViewMatrix, translation);

    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        rotation[0],
        [1, 0, 0]);

    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        rotation[1],
        [0, 1, 0]);

    mat4.rotate(modelViewMatrix,
        modelViewMatrix,
        rotation[2],
        [0, 0, 1]);

    mat4.scale(modelViewMatrix,
        modelViewMatrix,
        [zoom, zoom, zoom]);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.position,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(programInfo.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.color,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(programInfo.color);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.projectionMatrix,false,projectionMatrix);
    gl.uniformMatrix4fv(programInfo.modelViewMatrix,false,modelViewMatrix);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function initEvents(){
    const
        rotationX = document.getElementById("rotationX"),
        rotationY = document.getElementById("rotationY"),
        rotationZ = document.getElementById("rotationZ");
    rotationX.max = Math.PI; rotationY.max = Math.PI; rotationZ.max = Math.PI;
    rotationX.min = -Math.PI; rotationY.min = -Math.PI; rotationZ.min = -Math.PI;
    document.getElementById("translationX").oninput = function() {
        translation[0] = parseFloat(this.value);
        drawScene()
    };
    document.getElementById("translationY").oninput = function() {
        translation[1] = parseFloat(this.value);
        drawScene()
    };
    document.getElementById("translationZ").oninput = function(){
        translation[2] = parseFloat(this.value);
        drawScene()
    };
    rotationX.oninput = function () {
        rotation[0] = parseFloat(this.value);
        drawScene()
    };
    rotationY.oninput = function () {
        rotation[1] = parseFloat(this.value);
        drawScene()
    };
    rotationZ.oninput = function () {
        rotation[2] = parseFloat(this.value);
        drawScene()
    };
    document.getElementById("fov").oninput = function () {
      fov = parseInt(this.value);
      drawScene()
    };
    document.getElementById("zoom").oninput = function () {
      zoom = parseFloat(this.value);
      drawScene()
    }
}