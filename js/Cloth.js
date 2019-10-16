//  布シミュレーション
//  断りがない限りMKS単位系を基準とするので空間座標の単位はmとする

//  質点
ClothNode = function(param) {
    this.pos = new THREE.Vector3(param.x, param.y, param.z); // 現在の空間座標　単位：m
    this.pre_pos = this.pos.clone();  	// 前の空間座標　単位：m
    this.m = param.m || 0;              // 運動計算の重み（0は固定点を表現する） 単位：Kg
};

//  布
//  segment_count   布を構成する質点をつなぐ節の数　縦横同数とする
//      例）segment_count == 2　
//      縦横それぞれに2つの節ができ、それらで繋がれる質点は合計9つとなる
//      o - o - o
//      |   |   |       
//      o - o - o
//      |   |   |
//      o - o - o
//      注意）- や | が節、oが質点を意味する
Cloth = function(segment_count) {
    this.segment_count = segment_count;
    this.r = 0.2;           //  空気抵抗係数　単位：Ns/m
    this.k = 500.0;         //  バネ係数 単位：N/m
    
    //  質点準備　地平面はxz面とし、segment_count + 2上空で、xz平面に並行になるよう配置する
    //  質点の質量は全て0.1Kgとした。本来は布の大きさと質点数、布全体の質量から割り出す
	this.points = [];	
	for (let y = 0; y <= segment_count; y++) {
		for (let x = 0; x <= segment_count; x++) {
			this.points.push(new ClothNode({x:x, y:segment_count + 2, z:y, m:0.1}));
		}
	}
	
	//  そのまま重力に任せ落下するだけなので、配列先頭最初の横一列を固定する
	for (var x = 0; x <= segment_count; x++) {
		this.points[x].m = 0;   //  mが0なら固定された質点とみなす
	}
};

//  シミュレート部
Cloth.prototype = {
    constructor: Cloth,

    //  経過時間を渡し、その間の移動量を計算させる
    //  dt  経過時間　単位：s
    update: function(dt) {
        
        //  全質点のposを力場の影響のみで更新
        //  更新まえのposはpre_posに記録される
        this.compute_constraint_free(dt); 
        
          
        this.compute_constraint(dt);
    }, 
    
    //  質点間の拘束を考慮せずに、力場（重力や風）の影響のみで質点の移動量を計算し全質点のposを更新する
    compute_constraint_free: function(dt) {
        let A_field = new THREE.Vector3(0, -9.8, 0);        //  力場の加速度：重力のみとした
        for (const point of this.points) {
            if (point.m === 0) continue;                     //  固定なので移動しない
            let DX = point.pos.clone().sub(point.pre_pos);  //  前回の移動距離（初期値は0となる）
            point.pre_pos.copy(point.pos);                  //  現在位置を記憶させる（次回の上記計算で利用）
            let V = DX.clone().divideScalar(dt);            //  前回の速度：v = dx / dt
            let A = V.multiplyScalar(-this.r / point.m);    //  空気抵抗により発生する加速度：a = v * -r / m  
            A.add(A_field);                                 //  力場の加速度に合算
            DX.add(A.multiplyScalar(1 / 2 * dt * dt));      //  今回の移動距離とする　v * dt + 1/2 * a * dt * dt  （DX：v * dt）
            point.pos.add(DX);                              //  位置更新
        }
    },

    //  質点間の拘束を移動量に反映させ全質点のposを更新する
    compute_constraint: function(dt) {
        //  ループ中に質点間の距離を使い拘束を計算するが、その計算結果を逐次posに
        //  反映しているためループ中に質点間の距離が変わってしまう
        //  ループ中の拘束計算には、変わる前のpos位置を記録させたpを使うことにする
        //  pが利用されるのは、このメソッド内でのみ
        for (let p of this.points) {
            p.p = p.pos.clone();
        }
        
        //  全質点に対して拘束処理を実行
        for (let y = 0; y <= this.segment_count; y++) {
            for (let x = 0; x <= this.segment_count; x++) {                
                let p1 = this.pointOf(x, y);
                
                //  p1を拘束する質点のp1からの縦横のオフセット群　[縦,横]のタプル
                let ds = [
                                    [ 0, -2],
                          [-1, -1], [ 0, -1], [ 1, -1],
                [-2,  0], [-1,  0],           [ 1,  0], [ 2,  0],
                          [-1,  1], [ 0,  1], [ 1,  1],
                                    [ 0,  2]
                        ];
                        
                //  p1に対する全拘束の計算を行いp1のposを更新
                for (let [dh, dv] of ds) {
                    let p2 = this.pointOf(x + dh, y + dv);
                    if (p2 !== undefined) {
                        //  p1-p2間の収縮・伸長前の距離を計算（節の長さを1mとしているので、以下の計算となる）
                        let l = Math.sqrt(dh * dh + dv * dv);
                        this.apply_constraint(dt, p1, p2, l);
                    }
                }
            }
        }        
    },
    
    //  与えられた縦横位置に質点が存在するなら、その質点を返す。存在しない場合undefinedを返す
    //  x   横位置　左から0,1,2,...,this.segment_count + 1　の範囲が存在範囲
    //  y   縦位置　上から0,1,2,...,this.segment_count + 1　の範囲が存在範囲
    pointOf: function(x, y) {
        let count = this.segment_count + 1;
        if (x < 0 || x >= count || y < 0 || y >= count) return undefined;
        i = y * count + x;
        if (i < 0)  return undefined;
        if (i >= this.points.length)  return undefined;
        return this.points[i];
    },

    //  2つの質点間の距離の収縮・伸長に基づきp側の座標を更新する
    //  dt  経過時間
    //  p   拘束を反映させる質点
    //  pConstraint 上記質点を拘束する質点
    //  rest_distance   2つの質点間の収縮・伸長していない場合の距離
    apply_constraint: function(dt, p, pConstraint, rest_distance) {
        var m = p.m + pConstraint.m;
        if (m === 0.0) return;  // 二つの質点がお互いに固定点

        // バネの力
        let distance = pConstraint.p.distanceTo(p.p);  // 質点間の距離
        var f = (distance - rest_distance) * this.k;    // 力（フックの法則）

        // 変位 ここでは伸びに抵抗し縮もうとする力をpConstraintに向けて進む力とする
        //  そのため pConstraint.pos - p.pos とした
        let FV = pConstraint.pos.clone().sub(p.pos).normalize();                
        let DX = FV.multiplyScalar(f / m * 1 / 2 * dt * dt);     // 力を変位に変換
    
        // 位置更新
        DX.multiplyScalar(p.m / m);
        p.pos.add(DX);
    }
};

