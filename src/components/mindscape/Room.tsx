import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Color, Group, Mesh, Vector3, type Object3D } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Button } from '@/components/ui/button';
import type { Section } from '@/content/room';
import { roomTexture, tokenColour } from './materials';
import { SceneLabel } from './SceneLabel';
import { OutdoorWindow } from './Outdoor';
import { Curtains } from './Curtains';
import { FramedDisplay, GlobeTable, LaptopScreen, PortraitFrame, PosterWall, Turntable, WarmLamp } from './RoomObjects';
import { drawEducationCard, drawJourneyTimeline, drawResearchPreview } from './frameArt';
import { frameImages } from '@/content/parse';
import { withBase } from '@/content/media';
import desk from '@/assets/models/desk.glb.asset.json';
import laptop from '@/assets/models/laptop.glb.asset.json';
import chair from '@/assets/models/chairDesk.glb.asset.json';
import shelf from '@/assets/models/bookcaseOpen.glb.asset.json';
import books from '@/assets/models/books.glb.asset.json';
import seat from '@/assets/models/loungeChairRelax.glb.asset.json';
import plant from '@/assets/models/pottedPlant.glb.asset.json';
import smallPlant from '@/assets/models/plantSmall1.glb.asset.json';
import lamp from '@/assets/models/lampRoundTable.glb.asset.json';
import table from '@/assets/models/sideTable.glb.asset.json';

type Vec=[number,number,number];
interface RoomProps{onSelect:(id:Section,index?:number)=>void;reset:number;evening:boolean;lampOn:boolean;onLamp:()=>void;zoom:number;selected:Section|null}
const focusPoints:Partial<Record<Section,Vec>>={projects:[-1.2,1.5,-1.8],notebook:[-2,1.5,-1.5],education:[-1.45,2.7,-3.3],experience:[-.15,2.7,-3.3],research:[2.05,2.7,-3.3],guestbook:[1,2.3,-3],books:[3,1.8,-2],music:[3.1,.9,.4],artwork:[-3,1.5,1],travel:[2.5,1.1,2.3],posters:[-4,2.6,.35],about:[-1.9,1.6,-2.5],balcony:[-3,1.6,-2]};
function Model({url,position,height,rotation=0,onClick,label='Take a closer look',children}:{url:string;position:Vec;height:number;rotation?:number;onClick?:()=>void;label?:string;children?:React.ReactNode}){
 const {scene}=useGLTF(withBase(url));const {clone,k,offset}=useMemo(()=>{const c=scene.clone(true);const bounds=new Box3().setFromObject(c);const size=bounds.getSize(new Vector3());const centre=bounds.getCenter(new Vector3());const k=height/size.y;const offset=new Vector3(-centre.x*k,-bounds.min.y*k,-centre.z*k);c.position.copy(offset);c.scale.setScalar(k);c.traverse((o:Object3D)=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;}});return {clone:c,k,offset};},[scene,height]);
 const [hover,setHover]=useState(false);const lift=useRef<Group>(null);
 useFrame((_,dt)=>{if(lift.current)lift.current.position.y+=((hover&&onClick?.03:0)-lift.current.position.y)*(1-Math.exp(-10*Math.min(dt,.05)));});
 return <group position={position} rotation={[0,rotation,0]} onClick={e=>{if(onClick){e.stopPropagation();onClick();}}} onPointerOver={e=>{if(onClick){e.stopPropagation();setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);document.body.style.cursor='auto';}}><group ref={lift}><primitive object={clone}/>{children&&<group position={offset} scale={k}>{children}</group>}</group>{hover&&<SceneLabel position={[0,height+.15,0]}><div className="tooltip-label">{label}</div></SceneLabel>}</group>;
}
function Block({at,size,colour,rotation,texture}:{at:Vec;size:Vec;colour:string;rotation?:Vec;texture?:ReturnType<typeof roomTexture>}){return <mesh position={at} rotation={rotation??[0,0,0]} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={colour} map={texture??null} roughness={.85}/></mesh>;}
function ObjectGroup({id,at,children,onSelect,label}:{id:Section;at:Vec;children:React.ReactNode;onSelect:(id:Section)=>void;label:string}){const [hover,setHover]=useState(false);return <group position={at} onClick={e=>{e.stopPropagation();onSelect(id);}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer';}} onPointerOut={()=>{setHover(false);document.body.style.cursor='auto';}}>{children}{hover&&<SceneLabel position={[0,.5,0]}><div className="tooltip-label">{label}</div></SceneLabel>}</group>;}
function Hotspot({at,id,onSelect,label}:{at:Vec;id:Section;onSelect:(id:Section)=>void;label:string}){return <SceneLabel position={at}><Button className="scene-hotspot" aria-label={label} title={label} onClick={()=>onSelect(id)}>+</Button></SceneLabel>;}
// Pan and zoom stay inside the room, so the camera can't wander off and lose it.
const ROOM_MIN=new Vector3(-3.8,.2,-3.2),ROOM_MAX=new Vector3(3.8,3.2,3);
function CameraRig({reset,zoom,selected}:Pick<RoomProps,'reset'|'zoom'|'selected'>){const controls=useRef<OrbitControlsImpl>(null);const {camera,size}=useThree();const tween=useRef<{target:Vector3;position:Vector3}|null>(null);
 // Phones in portrait: aim a little higher so the room sits below the welcome card.
 const portraitPhone=size.width<640&&size.height>size.width;const mobile=size.width<640;
 // Short landscape screens: shift the room right, clear of the welcome card on the left.
 const shortLandscape=size.height<520&&size.width>size.height;
 const home=useMemo(()=>new Vector3(shortLandscape?-1.4:0,portraitPhone?3.3:1.2,-.4),[portraitPhone,shortLandscape]);
 // Fit the whole room to the screen's width: a narrow, tall screen needs the camera further back.
 const aspect=size.width/Math.max(size.height,1);
 const distance=Math.min(36,Math.max(16.9,6/(Math.tan(19*Math.PI/180)*aspect)));
 const initial=useMemo(()=>(mobile?new Vector3(12,11,15):new Vector3(10,8,11)).normalize().multiplyScalar(distance).add(home),[mobile,home,distance]);
 useEffect(()=>{tween.current={target:home.clone(),position:initial.clone()};},[reset,initial,home]);
 useEffect(()=>{if(!controls.current)return;camera.position.sub(controls.current.target).multiplyScalar(zoom>0?.87:1.15).add(controls.current.target);controls.current.update();},[zoom,camera]);
 useEffect(()=>{if(!selected)return;const point=focusPoints[selected];if(!point)return;const target=new Vector3(...point);const direction=camera.position.clone().sub(target).normalize();tween.current={target,position:target.clone().add(direction.multiplyScalar(7))};},[selected,camera]);
 useFrame((_,dt)=>{if(!controls.current||!tween.current)return;const {position,target}=tween.current;const a=1-Math.exp(-4*Math.min(dt,.05));camera.position.lerp(position,a);controls.current.target.lerp(target,a);controls.current.update();if(camera.position.distanceTo(position)<.03)tween.current=null;});
 const clamp=()=>{const c=controls.current;if(!c||tween.current)return;const t=c.target;const before=t.clone();t.clamp(ROOM_MIN,ROOM_MAX);if(!before.equals(t))camera.position.add(t.clone().sub(before));};
 return <OrbitControls ref={controls} makeDefault target={home.toArray()} enablePan screenSpacePanning zoomToCursor panSpeed={.8} minDistance={4} maxDistance={Math.max(26,distance+4)} minPolarAngle={.35} maxPolarAngle={1.35} minAzimuthAngle={-.9} maxAzimuthAngle={1.35} enableDamping dampingFactor={.08} onStart={()=>{tween.current=null;}} onChange={clamp}/>;
}
function Scene(props:RoomProps&{ready:()=>void;reduced:boolean}){const {onSelect,evening,lampOn,onLamp,reduced}=props;const [colours]=useState(()=>Object.fromEntries(['wood','wood-light','room-wall','sage','rose','butter','ink','paper','scene-background'].map(k=>[k,new Color(tokenColour(k))])));const c=(k:string)=>colours[k]?.getStyle()??'white';const textures=useMemo(()=>({wood:roomTexture('wood'),paper:roomTexture('paper'),rug:roomTexture('rug')}),[]);const ready=useRef(false);
 useFrame(()=>{if(!ready.current){ready.current=true;requestAnimationFrame(props.ready);}});
 return <><color attach="background" args={[c('scene-background')]}/><ambientLight intensity={evening?.75:1.1}/><hemisphereLight args={[c('paper'),c('sage'),1.4]}/><directionalLight position={[-3,8,6]} intensity={evening?1.4:2.5} color={c('paper')} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8}/><Environment resolution={64}><Lightformer position={[0,5,0]} scale={[10,10,1]} intensity={2}/><Lightformer position={[-5,2,0]} rotation-y={Math.PI/2} scale={[10,5,1]} intensity={1} color={c('sage')}/></Environment>
 <Block at={[0,-.2,0]} size={[8.6,.35,7]} colour={c('wood')} texture={textures.wood}/><Block at={[0,-.01,0]} size={[8.4,.05,6.8]} colour={c('wood-light')} texture={textures.wood}/>
 {/* Open-front dollhouse architecture; true 3D objects remain explorable. */}
 <Block at={[1.3,1.85,-3.5]} size={[6,3.8,.16]} colour={c('room-wall')} texture={textures.paper}/><Block at={[-4.3,1.85,1]} size={[.16,3.8,5]} colour={c('room-wall')} texture={textures.paper}/>
 <Block at={[0,.15,-3.38]} size={[8.4,.22,.12]} colour={c('wood')}/><Block at={[-4.16,.15,.1]} size={[.12,.22,6.5]} colour={c('wood')}/>
 {/* A wide, glazed monsoon opening. */}
 <Block at={[-3.15,3.7,-3.5]} size={[2.3,.2,.25]} colour={c('wood')}/><Block at={[-3.15,.5,-3.5]} size={[2.3,.18,.35]} colour={c('wood')}/>{[-4.2,-3.15,-2.1].map(x=><Block key={x} at={[x,2.1,-3.5]} size={[.09,3.2,.2]} colour={c('wood')}/>)}<Block at={[-3.15,2,-3.5]} size={[2.3,.08,.15]} colour={c('wood')}/>
 <OutdoorWindow evening={evening} reduced={reduced} position={[-3.15,2.1,-3.52]} size={[2.12,3.12]}/><Curtains left={-4.22} right={-2.08} top={3.82} bottom={.6} z={-3.2} reduced={reduced}/>
 <Block at={[0,.04,.7]} size={[3.5,.035,2.45]} colour={c('sage')} texture={textures.rug}/>{[-1.65,1.65].map(x=><Block key={x} at={[x,.065,.7]} size={[.025,.012,2.3]} colour={c('paper')}/>)}
 <Suspense fallback={null}>
 <Model url={desk.url} position={[-1.65,0,-2.35]} height={1.38} onClick={()=>onSelect('skills')}/><Model url={laptop.url} position={[-1.15,1.39,-2.2]} height={.58} rotation={.16} onClick={()=>onSelect('projects')} label="Things I’ve built — open my workspace"><LaptopScreen/></Model><Model url={chair.url} position={[-1.55,0,-.9]} height={1.4} rotation={Math.PI+.2}/><WarmLamp url={lamp.url} position={[-2.6,1.4,-2.35]} height={.65} on={lampOn} onToggle={onLamp} reduced={reduced}/><PortraitFrame position={[-1.98,1.385,-2.66]} rotation={.3} onSelect={onSelect}/>
 <Model url={shelf.url} position={[3.2,0,-2.5]} height={2.6} onClick={()=>onSelect('books')} label="My bookshelf — open the library"/>{[.4,1.05,1.7].map((y,i)=><Model key={y} url={books.url} position={[3.1,y,-2.4]} height={.38} rotation={i*.13} onClick={()=>onSelect('books')} label="My bookshelf — open the library"/>)}
 <Model url={seat.url} position={[1.7,0,1.35]} height={1.3} rotation={-.6}/><Model url={table.url} position={[3.15,0,.45]} height={.8}/><Model url={plant.url} position={[-3.65,0,-2.5]} height={1.4}/><Model url={plant.url} position={[3.6,0,2.6]} height={1.45}/><Model url={smallPlant.url} position={[-.4,1.4,-2.5]} height={.42}/>
 </Suspense>
 <ObjectGroup at={[-2.05,1.45,-1.93]} id="notebook" onSelect={onSelect} label="Notes to myself"><Block at={[0,0,0]} size={[.65,.025,.42]} colour={c('paper')} rotation={[0,-.17,0]} texture={textures.paper}/><Block at={[0,.02,0]} size={[.01,.008,.42]} colour={c('wood')}/></ObjectGroup>
 {/* Education and work frames, not official certificates. */}
 <FramedDisplay id="education" position={[-1.45,2.75,-3.34]} label="My education — Monash University" draw={drawEducationCard} photo={frameImages.education} onSelect={onSelect}/>
 <FramedDisplay id="experience" position={[-.15,2.75,-3.34]} label="My journey — education, experience and milestones." draw={drawJourneyTimeline} photo={frameImages.experience} onSelect={onSelect}/>
 <FramedDisplay id="research" position={[2.05,2.75,-3.34]} label="Research — IEEE Xplore publication, WAMS 2024." draw={drawResearchPreview} photo={frameImages.research} onSelect={onSelect}/>
 <ObjectGroup at={[1,1.72,-3.33]} id="guestbook" onSelect={onSelect} label="Leave a little hello"><Block at={[0,0,0]} size={[1.4,1,.09]} colour={c('wood')}/><Block at={[0,0,.05]} size={[1.28,.88,.02]} colour={c('wood-light')} texture={textures.wood}/>{Array.from({length:6},(_,i)=><group key={i} position={[-.41+(i%3)*.4,.22-Math.floor(i/3)*.4,.08]} rotation={[0,0,(i%2?1:-1)*.08]}><Block at={[0,0,0]} size={[.31,.31,.012]} colour={c(i%3===0?'sage':i%3===1?'butter':'rose')}/><mesh position={[0,.13,.025]}><sphereGeometry args={[.02,8,8]}/><meshStandardMaterial color={c('ink')}/></mesh></group>)}</ObjectGroup>
 <ObjectGroup at={[-3.45,0,.55]} id="artwork" onSelect={onSelect} label="My creative corner"><group rotation={[0,.5,0]}>{[-.43,.43].map(x=><Block key={x} at={[x,1,0]} size={[.06,2,.07]} colour={c('wood')} rotation={[0,0,x*.2]}/>)}<Block at={[0,1.35,.03]} size={[.92,1.13,.06]} colour={c('wood')}/><Block at={[0,1.35,.08]} size={[.82,1.03,.015]} colour={c('paper')} texture={textures.paper}/><Block at={[0,.79,.12]} size={[1.02,.06,.2]} colour={c('wood')}/></group></ObjectGroup>
 <PosterWall position={[-4.19,2.6,.35]} onSelect={onSelect}/>
 <Turntable position={[3.15,.87,.45]} onSelect={onSelect} reduced={reduced}/>
 <GlobeTable position={[2.5,0,2.3]} onSelect={onSelect} reduced={reduced}/>
 <Hotspot at={[-1.15,2.15,-2.1]} id="projects" onSelect={onSelect} label="Explore my projects"/><Hotspot at={[1,2.35,-3.2]} id="guestbook" onSelect={onSelect} label="Leave a note"/><Hotspot at={[3.2,2.7,-2.3]} id="books" onSelect={onSelect} label="On my bookshelf"/><Hotspot at={[-3.4,2.2,.6]} id="artwork" onSelect={onSelect} label="Explore artwork"/><Hotspot at={[3.15,1.35,.45]} id="music" onSelect={onSelect} label="Browse music"/><Hotspot at={[-3.2,2.9,-3.25]} id="balcony" onSelect={onSelect} label="A little piece of home"/>
 <CameraRig reset={props.reset} zoom={props.zoom} selected={props.selected}/></>;
}
export default function Room(props:RoomProps){const [ready,setReady]=useState(false);const [reduced,setReduced]=useState(false);useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);},[]);return <div className="scene-wrap" data-scene-ready={ready?'true':undefined}><Canvas shadows dpr={[1,1.5]} camera={{position:[10,8,11],fov:38}} gl={{antialias:true}}><Scene {...props} reduced={reduced} ready={()=>setReady(true)}/></Canvas></div>;}