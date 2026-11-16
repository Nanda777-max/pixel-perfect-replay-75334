import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';
export function SceneLabel({position,children}:{position:[number,number,number];children:ReactNode}){
 return <Html position={position} center zIndexRange={[4,1]}>{children}</Html>;
}