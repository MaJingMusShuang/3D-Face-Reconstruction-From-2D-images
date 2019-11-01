var canvas;
var gl;
var vertexShader;
var fragmentShader;
var program;

var susanVertices;
var susanIndices;
var susanTexCoords;
var susanNormals;

var susanPosVertexBufferObject;
var susanTexCoordVertexBufferObject;
var susanIndexBufferObject;
var susanNormalBufferObject;


var matWorldUniformLocation;
var matViewUniformLocation;
var matProjUniformLocation;

var worldMatrix;
var viewMatrix;
var projMatrix;

var ambientUniformLocation;
var sunlightDirUniformLocation;
var sunlightIntUniformLocation;

var susanTexture;
var identityMatrix;

var ROTATION = 30 * Math.PI / 180; // const

var xLightAngle = 0;
var yLightAngle = 0;
var x=1, y=0, z=0; // light source position
var lightVec = vec3.clone([x,y,z]);

var xObjAngle = 0.0;
var yObjAngle = 0.0;

var mode = 0; // 0: default mode; 1: only adjust light; 2: adjust both light and obj pos

var InitDemo = function () {
	loadTextResource('./shader.vs.glsl', function (vsErr, vsText) {
		if (vsErr) {
			alert('Fatal error getting vertex shader (see console)');
			console.error(vsErr);
		} else {
			loadTextResource('./shader.fs.glsl', function (fsErr, fsText) {
				if (fsErr) {
					alert('Fatal error getting fragment shader (see console)');
					console.error(fsErr);
				} else {
					loadJSONResource('./majing_head.json', function (modelErr, modelObj) {
						if (modelErr) {
							alert('Fatal error getting Susan model (see console)');
							console.error(fsErr);
						} else {
							loadImage('./head_texture.png', function (imgErr, img) {
								if (imgErr) {
									alert('Fatal error getting Susan texture (see console)');
									console.error(imgErr);
								} else { 
									RunDemo(vsText, fsText, img, modelObj);
								}
							});
						}
					});
				}
			});
		}
	});
};

var RunDemo = function (vertexShaderText, fragmentShaderText, SusanImage, SusanModel) {
	console.log('This is working');
	

	canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl');
	document.onkeydown = handleKeyDown;

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	//
	// Create shaders
	// 
	vertexShader = gl.createShader(gl.VERTEX_SHADER);
	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	//
	// Create buffer
	//
	susanVertices = SusanModel.meshes[0].vertices;
	susanIndices = [].concat.apply([], SusanModel.meshes[0].faces);
	susanTexCoords = SusanModel.meshes[0].texturecoords[0];
	susanNormals = SusanModel.meshes[0].normals;

	susanPosVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, susanPosVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanVertices), gl.STATIC_DRAW);

	susanTexCoordVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, susanTexCoordVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanTexCoords), gl.STATIC_DRAW);

	susanIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, susanIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(susanIndices), gl.STATIC_DRAW);

	susanNormalBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, susanNormalBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(susanNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, susanPosVertexBufferObject);
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, susanTexCoordVertexBufferObject);
	var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
	gl.vertexAttribPointer(
		texCoordAttribLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0
	);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, susanNormalBufferObject);
	var normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
	gl.vertexAttribPointer(
		normalAttribLocation,
		3, gl.FLOAT,
		gl.TRUE,
		3 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	gl.enableVertexAttribArray(normalAttribLocation);

	//
	// Create texture
	//
	susanTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, susanTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		SusanImage
	);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);
	getMVLocation();
	worldMatrix = new Float32Array(16);
	viewMatrix = new Float32Array(16);
	projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, 20], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
	setMVMatrix();

	//
	// Lighting information
	//
	setLightSrc();

	gl.bindTexture(gl.TEXTURE_2D, susanTexture);
	gl.activeTexture(gl.TEXTURE0);

	gl.drawElements(gl.TRIANGLES, susanIndices.length, gl.UNSIGNED_SHORT, 0);
};


function getMVLocation(){
	matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
}

function setMVMatrix(){
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
}

function setLightSrc(){
	ambientUniformLocation = gl.getUniformLocation(program, 'ambientLightIntensity');
	sunlightDirUniformLocation = gl.getUniformLocation(program, 'sun.direction');
	unlightIntUniformLocation = gl.getUniformLocation(program, 'sun.color');

	gl.uniform3f(ambientUniformLocation, 1, 1, 1);
	gl.uniform3f(sunlightDirUniformLocation, x, y, z);
	gl.uniform3f(sunlightIntUniformLocation, 0.9, 0.9, 0.9);
}


function draw_scene(){
	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);
	setMVMatrix();

	//
	// Lighting information
	//
	setLightSrc(x,y,z);
	

	gl.bindTexture(gl.TEXTURE_2D, susanTexture);
	gl.activeTexture(gl.TEXTURE0);

	gl.drawElements(gl.TRIANGLES, susanIndices.length, gl.UNSIGNED_SHORT, 0);
}

function handleKeyDown(event){
	console.log("keydown");
	if(event.keyCode == 65){
		//a-KEY: light mode
		mode = 1;
      
    }else if(event.keyCode == 83){
		//s-KEY: light and object mode
		mode = 2;
      
    }else if(event.keyCode == 27){
		// esc-KEY: reset
		mode = 0;

		worldMatrix = new Float32Array(16);
		viewMatrix = new Float32Array(16);
		projMatrix = new Float32Array(16);
		mat4.identity(worldMatrix);
		mat4.lookAt(viewMatrix, [0, 0, 20], [0, 0, 0], [0, 1, 0]);
		mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
		setMVMatrix();

		x = 1;
		y = 0;
		z = 0;
		setLightSrc();
		draw_scene();

	}else if(event.keyCode >= 37 && event.keyCode <= 40){
		lightVec = vec3.clone([x,y,z]);
		if(mode==1){ // Adjust light source position
			rotateLightSrc(event);
		}else{
			// Adjust light source and object together
			identityMatrix = new Float32Array(16);
			mat4.identity(identityMatrix);
			if(event.keyCode == 37){
				// left-arrow
				yObjAngle -= ROTATION;
				mat4.rotate(worldMatrix, identityMatrix, yObjAngle, [0, 1, 0]);
			}else if(event.keyCode == 38){
				// up-arrow
				xObjAngle += ROTATION;
				mat4.rotate(worldMatrix, identityMatrix, xObjAngle, [1, 0, 0]);
			}else if(event.keyCode == 39){
				// right-arrow
				yObjAngle += ROTATION;
				mat4.rotate(worldMatrix, identityMatrix, yObjAngle, [0, 1, 0]);
			}else if(event.keyCode == 40){
				// down-arrow
				xObjAngle -= ROTATION;
				mat4.rotate(worldMatrix, identityMatrix, xObjAngle, [1, 0, 0]);
			}
			rotateLightSrc(event);
			draw_scene();
		}
		x = lightVec[0];
		y = lightVec[1];
		z = lightVec[2];
		
		// left-arrow
	}else{
		alert("wrong key");
	}
	showLightPos();
	showMode();
}

/**
 * Adjust Light Source Position
 * @param {*} event : key board event
 */
function rotateLightSrc(event){
	if(event.keyCode == 37){
		// left arrow: y rotation decrease
		yLightAngle -= ROTATION;
		vec3.rotateY(lightVec, lightVec, [0,0,0], yLightAngle);

		//old version
		//var projR = Math.sqrt(x*x + z*z); // light point projection on xoz plane
		//x = projR * Math.cos(yLightAngle); //
		//z = projR * Math.sin(yLightAngle);
	}else if(event.keyCode == 39){
		// right arrow: y rotation increase
		yLightAngle += ROTATION;
		vec3.rotateY(lightVec, lightVec, [0,0,0], yLightAngle);
		//var projR = Math.sqrt(x*x + z*z); // light point projection on xoz plane
		//x = projR * Math.cos(yLightAngle);
		//z = projR * Math.sin(yLightAngle);
	}else if(event.keyCode == 38){
		// up arrow: x rotation increase
		xLightAngle += ROTATION;
		vec3.rotateX(lightVec, lightVec, [0,0,0], yLightAngle);
		//var projR = Math.sqrt(y*y + z*z);
		//y = projR * Math.cos(xLightAngle);
		//z = projR * Math.sin(xLightAngle);

	}else if(event.keyCode == 40){
		// down arrow: x rotation decrease
		xLightAngle -= ROTATION;
		vec3.rotateY(lightVec, lightVec, [0,0,0], yLightAngle);
		//var projR = Math.sqrt(y*y + z*z);
		//y = projR * Math.cos(xLightAngle);
		//z = projR * Math.sin(xLightAngle);
	}
}

function showMode(){
	var str;
	if(mode==0){
		str = "default";
	}else if(mode==1){
		str = "light adjusting";
	}else if(mode==2){
		str = "head adjusting";
	}
    document.getElementById("mode_display").innerHTML = "Mode: "+str;
}

function showLightPos(){
    document.getElementById("light_pos").innerHTML = "Light source position (x,y,z): ("+ x + ", " + y + ", " + z + ")";
}

