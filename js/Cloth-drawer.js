Cloth.prototype.makeDrawer = function(lab) {
    if (this.drawer === undefined) {
    	let n = this.points.length;
    	let positions = new Float32Array( n * 3 ); //頂点座標
    	let colors = new Float32Array( n * 3 );    //頂点色
    	var color = new THREE.Color().setRGB(1,0.7,0);
    	var i = 0;
    	for (let point of this.points) {
    		positions[i] = point.pos.x;
    		positions[i + 1] = point.pos.y;
    		positions[i + 2] = point.pos.z;
    		colors[i] = color.r;
    		colors[i + 1] = color.g;
    		colors[i + 2] = color.b;
    		i += 3;
    	}
    	let geometry = new THREE.BufferGeometry();
    	geometry.addAttribute("position", new THREE.BufferAttribute( positions, 3 ) );
    	geometry.addAttribute("color", new THREE.BufferAttribute( colors, 3 ) );
    	let material = new THREE.PointsMaterial({ size:1, vertexColors: true });
	    this.drawer = new THREE.Points( geometry, material );
    }
    return this.drawer;
};

Cloth.prototype.updateDrawer = function(lab) {
    if (this.drawer !== undefined) {
        let positions = this.drawer.geometry.attributes.position.array;
    	var i = 0;
        for (let point of this.points) {
    		positions[i] = point.pos.x;
    		positions[i + 1] = point.pos.y;
    		positions[i + 2] = point.pos.z;
    		i += 3;
        }
        this.drawer.geometry.attributes.position.needsUpdate = true;
    }
};
