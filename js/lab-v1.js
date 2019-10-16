function Lab(id) {
	//	描画領域の設定
	this.canvasframe = document.getElementById(id);
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setSize(this.canvasframe.clientWidth, this.canvasframe.clientHeight );
	this.renderer.setClearColor(0xEEEEEE, 1.0);
	this.canvasframe.appendChild(this.renderer.domElement);

	//	描画領域に表示する3D空間を撮影するカメラを決定
	this.camera = new THREE.PerspectiveCamera( 30 , this.canvasframe.clientWidth / this.canvasframe.clientHeight , 1 , 10000 );
	this.camera.position.set(0, 500, 500);
	this.camera.up.set(0, 1, 0);
	this.camera.lookAt( {x:0, y:this.camera.position.y * 0.3, z:0 } );

	//	3D空間を用意
	this.scene = new THREE.Scene();

	//	用意した3D空間に光源を投入
    this.light = new THREE.DirectionalLight(0xFFFFFF, 1);
	this.light.position.set( 0, 2000, 0 );
	this.scene.add(this.light);
}

Lab.prototype = {
    constructor: Lab,	
    
    setup: function (param) {
		param = param || {};
		if (param.floor !== undefined) {
			this.makeFloor(param.floor);
		}
		if (param.shadow !== undefined && param.shadow) {
			this.shadowOn();
		}
		if (param.useTrackball !== undefined && param.useTrackball) {
			this.useTrackball();
		}
	},
		
	show : function() { 
		this.renderer.clear();
		this.renderer.render(this.scene, this.camera);
	},

	update : function() {
		if (this.trackball === undefined) return;
		this.trackball.update();
	},
	
	shadowOn: function () {
		//	影を落とすための調整
		this.renderer.shadowMap.enabled = true;
		this.light.castShadow = true;
		let altitude = 30;					//	画面最大高度 m
		this.light.shadow.camera.left = -altitude;
		this.light.shadow.camera.bottom = -altitude;
		this.light.shadow.camera.right = altitude;
		this.light.shadow.camera.top = altitude;
		this.light.shadow.camera.far = 3000;
		
		if (this.floor !== undefined) this.floor.receiveShadow = true;
	},
	
	makeFloor : function(param) {
		param = param || {};
		let segment = param.segment || 1;
		let color = param.color || 0xffffff;
		this.floor = new THREE.Mesh(
			new THREE.PlaneGeometry(segment, segment),
			new THREE.MeshLambertMaterial({color: color}));
		this.floor.rotateX(-Math.PI/2);
		this.floor.position.set(0,0,0);
		let width = param.width || segment;
		let height = param.height || segment;
		let width_scale = width / segment;
		let height_scale = height / segment;
		this.floor.scale.set(width_scale, height_scale, 1);
		this.scene.add(this.floor);
		return this.floor;
	},
	
	useTrackball : function() {
		//	カメラの向き・ズームのコントローラ追加
		this.trackball = new THREE.TrackballControls(this.camera, this.canvasframe);
		this.trackball.staticMoving = true;
		this.trackball.rotateSpeed *= 3;
		this.trackball.zoomSpeed *= 0.2;
	}
};

Lab.prototype.makeBall = function (param) {
	let segment = param.segment || 10;
	let color = param.color || 0xff0000;
	ball = new THREE.Mesh(
		new THREE.SphereGeometry(segment, segment, segment), 
		new THREE.MeshLambertMaterial({color: color}));
	ball.position.set(0, 0, 0);
 	let radius = param.radius || (segment / 2);
	let scale = radius / segment;
	ball.scale.set(scale, scale, scale);
	this.scene.add(ball);
	return ball;
};

Lab.prototype.makeBox = function() {
	cube = new THREE.Mesh(
		new THREE.CubeGeometry(10,10,10),
		new THREE.MeshLambertMaterial({color: 0xff0000}));
	this.scene.add(cube);
	cube.position.set(0,0,0);
	return cube;
};
	
Lab.prototype.makeLine = function(points, color) {
	color = color || new THREE.Color(0x888888);
	var geometry = new THREE.Geometry();
	for (var i = 0; i < points.length; i += 3) {
		geometry.vertices[ i / 3 ] = new THREE.Vector3(points[i + 0], points[i + 1], points[i + 2]);
	}
	var material = new THREE.LineBasicMaterial({ color: color.getHex() });
	var lines = new THREE.Line(geometry, material);
	this.scene.add(lines);
	return lines;
};

Lab.prototype.makeArrow = function() {
	arrow = new THREE.ArrowHelper(
		new THREE.Vector3(0,1,0),
		new THREE.Vector3(0,0,0),
		1,
		0xff0000,
		0.3,
		0.3);
	this.scene.add(arrow);
	return arrow;
};

