import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

// Project scene labels into the existing DOM tree instead of creating nested React roots.
export function SceneLabel({position,children}:{position:[number,number,number];children:ReactNode}){
 const group=useRef<Group>(null);const element=useRef<HTMLDivElement>(null);const {gl,camera,size}=useThree();const point=useRef(new Vector3());
 useFrame(()=>{if(!group.current||!element.current)return;group.current.getWorldPosition(point.current);point.current.project(camera);const x=(point.current.x*.5+.5)*size.width;const y=(-point.current.y*.5+.5)*size.height;element.current.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;element.current.style.visibility=point.current.z>1?'hidden':'visible';});
 const parent=gl.domElement.parentElement;
 return <group ref={group} position={position}>{parent&&createPortal(<div ref={element} className="projected-label">{children}</div>,parent)}</group>;
}