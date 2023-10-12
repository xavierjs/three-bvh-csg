import { Vector3, Ray } from 'three';
import { toEdgeIndex, toTriIndex, matchEdges } from './utils/halfEdgeUtils.js';
import { toNormalizedRay } from './utils/hashUtils.js';
import { RaySet } from './utils/RaySet.js';

const _tempVec = new Vector3();
const _v0 = new Vector3();
const _v1 = new Vector3();
const _ray = new Ray();

export function computeDisjointEdges_new(
	geometry,
	unmatchedSet,
) {

	const attributes = geometry.attributes;
	const indexAttr = geometry.index;
	const posAttr = attributes.position;

	const disjointConnectivityMap = new Map();
	const fragmentMap = new Map();
	const edges = Array.from( unmatchedSet );
	const rays = new RaySet();

	for ( let i = 0, l = edges.length; i < l; i ++ ) {

		const index = edges[ i ];
		const triIndex = toTriIndex( index );
		const edgeIndex = toEdgeIndex( index );

		let i0 = 3 * triIndex + edgeIndex;
		let i1 = 3 * triIndex + ( edgeIndex + 1 ) % 3;
		if ( indexAttr ) {

			i0 = indexAttr.getX( i0 );
			i1 = indexAttr.getX( i1 );

		}

		_v0.fromBufferAttribute( posAttr, i0 );
		_v1.fromBufferAttribute( posAttr, i1 );

		// get the rays
		toNormalizedRay( _v0, _v1, _ray );

		let info;
		let commonRay = rays.findClosestRay( _ray );
		if ( commonRay === null ) {

			commonRay = _ray.clone();
			rays.addRay( commonRay );

		}

		if ( ! fragmentMap.has( commonRay ) ) {

			fragmentMap.set( commonRay, {

				forward: [],
				reverse: [],
				ray: commonRay,

			} );

		}

		info = fragmentMap.get( commonRay );

		let start = getProjectedDistance( commonRay, _v0 );
		let end = getProjectedDistance( commonRay, _v1 );
		if ( start > end ) {

			[ start, end ] = [ end, start ];

		}

		if ( _ray.direction.dot( commonRay.direction ) < 0 ) {

			info.reverse.push( { start, end, index } );

		} else {

			info.forward.push( { start, end, index } );

		}

	}

	// fragmentMap.forEach( info => {

	// 	let fwd = 0;
	// 	let rev = 0;
	// 	let tot = 0;
	// 	info.forward.forEach( ( { start, end } ) => fwd += end - start );
	// 	info.reverse.forEach( ( { start, end } ) => rev += end - start );

	// 	tot += Math.abs( fwd - rev );
	// 	console.log('TOTAL', tot);

	// } );

	fragmentMap.forEach( info => {

		matchEdges( info.forward, info.reverse, disjointConnectivityMap );

	} );

	fragmentMap.forEach( info => {

		let fwd = 0;
		let rev = 0;
		let tot = 0;
		info.forward.forEach( ( { start, end } ) => fwd += end - start );
		info.reverse.forEach( ( { start, end } ) => rev += end - start );

		tot += Math.abs( fwd - rev );
		// console.log('TOTAL', tot, fwd, rev );
		if ( fwd > 0.0000001 ) {


			console.log('TOTAL', tot, fwd, rev );
			console.log(info);

		}

	} );

	return {
		disjointConnectivityMap,
		fragmentMap,
	};

}

function getProjectedDistance( ray, vec ) {

	// TODO: rotate onto the line here?
	return _tempVec.subVectors( vec, ray.origin ).dot( ray.direction );

}
