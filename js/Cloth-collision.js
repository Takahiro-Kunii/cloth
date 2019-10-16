// 球とのヒット
Cloth.prototype.update_sphere_collision = function(pos, radius) {
    for (let point of this.points) {
        let v = point.pos.clone().sub(pos);            
        let d = v.length();
        if (d < radius) {    // ヒットしたので球の表面に押し出す
            v.multiplyScalar(radius / d);                
            point.pos.addVectors(pos, v);
        }
    }
};
