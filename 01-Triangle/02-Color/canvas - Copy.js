// JavaScript source code
var canvas = null;
var bFullscreen = false;
var context = null;

// WebGL
var gl = null;
var canvas_original_width;
var canvas_original_height;

const webGLMacros =
{
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_COLOR: 1,
    AMC_ATTRIBUTE_NORMAL: 2,
    AMC_ATTRIBUTE_TEXTURE0: 3,
}

var shaderProgramObject;
var VBO_position;
var VAO;
var mvpMatrixUniform;
var perspectiveProjectionMatrix = null;
var VBOColor;
var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame


function main()
{
    // code
    canvas = document.getElementById("APS");
    if (!canvas) {
        console.log("ERROR: Obtaining Canvas Failed!\n");
    }
    else
    {
        console.log("Obtaining Canvas Successful\n");
    }

    // backup canvas 
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    // init
    Init();

    // resize
    resize();

    // display
    display();

   
    // Add Keyboard and Mouse Listener
    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);

}

// Keyboard Handler
function keyDown(event)
{
    // code
    //alert("A Key is Pressed");
    switch (event.keyCode)
    {
        case 70:
            toggleFullscreen();
            //drawText("Hello World !!!");
            break;
        case 69: // e
            Uninit();
            break;
    }

}

// Mouse Handler
function mouseDown()
{
    // code
    //alert("A Mouse Button is Clicked");
}


function Init()
{
    // code
    // Obtain WwbGL context
    gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log("ERROR: getContext of webgl Failed!\n");
    }
    else {
        console.log("Obtaining getContext of webgl Successful\n");
    }

    // Set Viewport width and height of context
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    // VERTEX SHADER
    var vertexShaderSourcecode =
        "#version 300 es" +
        "\n" +
        "in vec4 a_position;" +
        "in vec4 a_color;" +
        "uniform mat4 u_mvpMatrix;" +
        "out vec4 a_color_out;" +
        "void main(void)" +
        "{" +
        " gl_Position = u_mvpMatrix * a_position;" +
        " a_color_out = a_color;" +
        "}";

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourcecode);
    gl.compileShader(vertexShaderObject);

    if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0)
        {
            alert("Vertex Shader Error"+Error);
            Uninit();
        }
    }


    // FRAGMENT SHADER
    var fragmentShaderSourcecode =
        "#version 300 es" +
        "\n" +
        "precision highp float;" +
        "in vec4 a_color_out;" +
        "out vec4 FragColor;" +
       
        "void main(void)" +
        "{" +
        "FragColor=a_color_out;" +
        "}";

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourcecode);
    gl.compileShader(fragmentShaderObject);

    if (gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if (error.length > 0)
        {
            alert("Fragment Shader Error" + Error);
            Uninit();
        }
    }

    // SHADER PROGRAM
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    // PRE LINKING SHADER ATTRIBUTE
    gl.bindAttribLocation(shaderProgramObject,
        webGLMacros.AMC_ATTRIBUTE_POSITION,
        "a_position");

    gl.bindAttribLocation(shaderProgramObject,
        webGLMacros.AMC_ATTRIBUTE_COLOR,
        "a_color");

    // SHADER PROGRAM LINKING
    gl.linkProgram(shaderProgramObject);
    if (gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS) == false)
    {
        var error = gl.getProgramInfoLog(shaderProgramObject);
        if (error.length > 0) {
            alert("shaderProgramObject Error" + Error);
            Uninit();
        }
    }

    // Get Uniform location
    mvpMatrixUniform = gl.getUniformLocation(shaderProgramObject,
        "u_mvpMatrix");

    // VOA AND VBA Array related lines

	// declarations of vertex data arrays

    var triangleVertices = new Float32Array([
        0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0
    ]);

    var triangleColor = new Float32Array([
        1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0
    ]);

    // VA0

    VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    // VBO Position
    VBO_position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO_position);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(webGLMacros.AMC_ATTRIBUTE_POSITION,
        3,
        gl.FLOAT,
        false,
        0,
        0);

    gl.enableVertexAttribArray(webGLMacros.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    // VBO Color
    VBOColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBOColor);
    gl.bufferData(gl.ARRAY_BUFFER, triangleColor, gl.STATIC_DRAW);
    gl.vertexAttribPointer(webGLMacros.AMC_ATTRIBUTE_COLOR,
        3,
        gl.FLOAT,
        false,
        0,
        0);

    gl.enableVertexAttribArray(webGLMacros.AMC_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    gl.bindVertexArray(null);



    // Depth Related Changes
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);


    // clear the screen by blue color
    gl.clearColor(0.0, 0.0, 0.0, 1.0); 

    perspectiveProjectionMatrix = mat4.create();



}

function toggleFullscreen() {
    // code
    var fullscreen_element = document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        null;

    // if not fullscreen
    if (fullscreen_element == null) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
        else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        }
        else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        }
        else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
        bFullscreen = true;
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        bFullscreen = false;
    }


}
function resize()
{
     // code 
    if (bFullscreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    if (canvas.height == 0)
        canvas.height = 1;
    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 1.0, 100.0);
   
}

function display()
{
    //code
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    var translationMatrix = mat4.create();

    // Method 1
    vec3.set(translationMatrix, 0, 0, -6.0);
    mat4.translate(modelViewMatrix, modelViewMatrix, translationMatrix);
    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);

    gl.uniformMatrix4fv(mvpMatrixUniform, false, modelViewProjectionMatrix);

    gl.bindVertexArray(VAO);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);
    gl.useProgram(null);

    requestAnimationFrame(display, canvas);
    update();
}

function update()
{
    //code
}

function Uninit()
{
    //code
    window.close();
    if (VAO)
    {
        gl.deleteVertexArray(vao);
        vao = null;
    }

    if (VBO_position)
    {
        gl.deleteBuffer(VBO_position);
        VBO_position = null;
    }

    if (VBOColor) {
        gl.deleteBuffer(VBOColor);
        VBOColor = null;
    }

    if (shaderProgramObject)
    {
        gl.useProgram(shaderProgramObject);
        var shaderObjects = gl.getAttachedShaders(shaderProgramObject);
        for (let i = 0; i < shaderObjects.length; i++)
        {
            gl.detachShader(shaderProgramObject, shaderObjects[i]);
            gl.deleteShader(shaderObjects[i]);
            shaderObjects[i] = null;
        }
        gl.useProgram(null);

        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }
}

