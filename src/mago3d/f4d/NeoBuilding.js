'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuilding
 */
var NeoBuilding = function() 
{
	if (!(this instanceof NeoBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name = "";
	this.metaData;
	this.buildingId;
	this.buildingType; // use this for classify a building.***
	this.buildingFileName = "";
	this.bbox;
	this.bboxAbsoluteCenterPos;
	
	// References and Models.*********************************************
	this.motherNeoReferencesArray = []; 
	this.motherNeoReferencesMap; 
	this.motherBlocksArray = []; 
	
	// Current visible objects.*******************************************
	this.currentVisibleOctreesControler; //  class VisibleObjectsControler;
	
	// Aditional Color.***************************************************
	this.isHighLighted;
	this.isColorChanged;
	this.aditionalColor; // use for colorChanged.***

	// Textures loaded.***************************************************
	this.texturesLoaded; // material textures.***

	// The octree.********************************************************
	this.octree; // f4d_octree. ***

	// auxiliar vars.
	this.distToCam; // used to sort neoBuildings by distance to cam, and other things.***
	this.currentLod;

	// The simple building.***********************************************
	this.simpleBuilding3x3Texture; // old version.***
	
	// In version 001, there are 6 lods.***
	this.lodMeshesMap;
	this.lodBuildingDatasMap;
	
	// Render settings.***************************************************
	// provisionally put this here.
	this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getImageFileNameForLOD = function(lod) 
{
	var lodBuildingData = this.getLodBuildingData(lod);
	
	if (lodBuildingData === undefined)
	{ return undefined; }
	
	return lodBuildingData.textureFileName;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getReferenceObject = function(refObjectIndex) 
{
	if (this.motherNeoReferencesArray === undefined)
	{ return undefined; }
	return this.motherNeoReferencesArray[refObjectIndex];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getReferenceObjectsArrayByObjectId = function(objectId) 
{
	if (this.motherNeoReferencesMap === undefined)
	{ return undefined; }

	var refObject = this.motherNeoReferencesMap[objectId];
	return refObject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.putReferenceObject = function(refObject, refObjectIdx) 
{
	// function called by "NeoReferencesMotherAndIndices.prototype.parseArrayBufferReferencesVersioned".***
	if (this.motherNeoReferencesArray === undefined)
	{ this.motherNeoReferencesArray = []; }

	this.motherNeoReferencesArray[refObjectIdx] = refObject;
	
	// Additionally, make a objects map.
	if (this.motherNeoReferencesMap === undefined)
	{ this.motherNeoReferencesMap = {}; }
	
	var objectsArray = this.motherNeoReferencesMap[refObject.objectId];
	if (objectsArray === undefined)
	{ objectsArray = []; }
	
	objectsArray.push(refObject);
	
	this.motherNeoReferencesMap[refObject.objectId] = objectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.getRenderSettingApplyOcclusionCulling = function() 
{
	return this.applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
NeoBuilding.prototype.setRenderSettingApplyOcclusionCulling = function(applyOcclusionCulling) 
{
	this.applyOcclusionCulling = applyOcclusionCulling;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsModelReferences = function(gl, vboMemoryManager) 
{
	// 1rst, clear this.motherNeoReferencesMap.
	if (this.motherNeoReferencesMap)
	{ 
		this.motherNeoReferencesMap = {}; 
		this.motherNeoReferencesMap = undefined;
	}
	
	var blocksCount = this.motherBlocksArray.length;
	for (var i=0; i<blocksCount; i++)
	{
		if (this.motherBlocksArray[i])
		{ this.motherBlocksArray[i].deleteObjects(gl, vboMemoryManager); }
		this.motherBlocksArray[i] = undefined;
	}
	this.motherBlocksArray = [];

	var referencesCount = this.motherNeoReferencesArray.length;
	for (var i=0; i<referencesCount; i++)
	{
		if (this.motherNeoReferencesArray[i])
		{ this.motherNeoReferencesArray[i].deleteObjects(gl, vboMemoryManager); }
		this.motherNeoReferencesArray[i] = undefined;
	}
	this.motherNeoReferencesArray = [];
	
	// delete textures on the GPU.***.
	if (this.texturesLoaded)
	{
		var texture;
		var texturesCount = this.texturesLoaded.length;
		for (var i=0; i<texturesCount; i++)
		{
			texture = this.texturesLoaded[i];
			if (texture)
			{
				if (texture.texId)
				{
					gl.deleteTexture(texture.texId);
					texture.texId = undefined;
					texture.fileLoadState = CODE.fileLoadState.READY;
				}
			}
		}
	}

};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsLodMesh = function(gl, vboMemoryManager, lodMeshKey) 
{
	// TEST delete lod 3.***
	if (this.lodMeshesMap !== undefined)
	{
		if (Object.prototype.hasOwnProperty.call(this.lodMeshesMap, lodMeshKey))
		{
			var legoSkin = this.lodMeshesMap[lodMeshKey];
			if (legoSkin.vbo_vicks_container !== undefined)
			{
				legoSkin.vbo_vicks_container.deleteGlObjects(gl, vboMemoryManager);
				legoSkin.vbo_vicks_container = undefined;
			}
			/*
			legoSkin.textureName = undefined;
			if (legoSkin.texture)
			{
				legoSkin.texture.deleteObjects(gl);
			}
			legoSkin.texture = undefined;
			if(legoSkin.bbox)
			{
				legoSkin.bbox.deleteObjects();
			}
			legoSkin.bbox = undefined;
			*/
	
			legoSkin.fileLoadState = 0;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjectsLod2 = function(gl, vboMemoryManager) 
{
	if (this.octree !== undefined)
	{ 
		// deletes the geometry and the texture.***
		this.octree.deleteObjectsLego(gl, vboMemoryManager); 
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteObjects = function(gl, vboMemoryManager, deleteMetadata) 
{
	if(deleteMetadata)
	{
		this.metaData.deleteObjects();
		this.metaData.fileLoadState = CODE.fileLoadState.READY;
	}

	this.deleteObjectsModelReferences(gl, vboMemoryManager);

	// The octree.
	if (this.octree !== undefined)
	{ this.octree.deleteObjects(gl, vboMemoryManager); }
	this.octree = undefined; // f4d_octree. Interior objects.***
	
	//this.buildingFileName = "";

	this.allFilesLoaded = false;
	this.isReadyToRender = false;

	// delete textures.
	if (this.texturesLoaded)
	{
		var texturesCount = this.texturesLoaded.length;
		for (var i=0; i<texturesCount; i++)
		{
			if (this.texturesLoaded[i])
			{
				this.texturesLoaded[i].deleteObjects(gl);
			}
			this.texturesLoaded[i] = undefined;
		}
		this.texturesLoaded.length = 0;
	}
	this.texturesLoaded = undefined;
	
	// delete lod3, lod4, lod5.***
	if (this.lodMeshesMap !== undefined)
	{
		for (var key in this.lodMeshesMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.lodMeshesMap, key))
			{
				var legoSkin = this.lodMeshesMap[key];
				legoSkin.deleteObjects(gl, vboMemoryManager);
				legoSkin = undefined;
			}
		}
		this.lodMeshesMap = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.deleteLodMesh = function(gl, lod, vboMemoryManager) 
{
	if (this.lodMeshesMap !== undefined)
	{
		var legoSkin = this.lodMeshesMap[lod];
		if (legoSkin !== undefined)
		{
			legoSkin.deleteObjects(gl, vboMemoryManager);
			legoSkin = undefined;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	if (this.bboxAbsoluteCenterPos === undefined)
	{
		this.calculateBBoxCenterPositionWorldCoord(geoLoc);
	}
	
	return this.bboxAbsoluteCenterPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.calculateBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	var bboxCenterPoint;
	
	bboxCenterPoint = this.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
	
	// Now, must applicate the aditional translation vector. Aditional translation is made when we translate the pivot point.
	if (geoLoc.pivotPointTraslation)
	{
		var traslationVector;
		traslationVector = geoLoc.tMatrix.rotatePoint3D(geoLoc.pivotPointTraslation, traslationVector );
		this.bboxAbsoluteCenterPos.add(traslationVector.x, traslationVector.y, traslationVector.z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getTextureId = function(texture) 
{
	var texId;
	var texturesLoadedCount = this.texturesLoaded.length;
	var find = false;
	var i=0;
	while (!find && i < texturesLoadedCount ) 
	{
		if (this.texturesLoaded[i].textureImageFileName === texture.textureImageFileName) 
		{
			find = true;
			texId = this.texturesLoaded[i].texId;
		}
		i++;
	}

	return texId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
NeoBuilding.prototype.getSameTexture = function(texture) 
{
	var sameTexture;
	var texturesLoadedCount = this.texturesLoaded.length;
	var find = false;
	var i=0;
	while (!find && i < texturesLoadedCount ) 
	{
		if (this.texturesLoaded[i].textureImageFileName === texture.textureImageFileName) 
		{
			find = true;
			sameTexture = this.texturesLoaded[i];
		}
		i++;
	}

	return sameTexture;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 */
NeoBuilding.prototype.updateCurrentVisibleIndicesExterior = function(eyeX, eyeY, eyeZ) 
{
	this._neoRefLists_Container.updateCurrentVisibleIndicesOfLists(eyeX, eyeY, eyeZ);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoBuilding.prototype.updateCurrentAllIndicesExterior = function() 
{
	this._neoRefLists_Container.updateCurrentAllIndicesOfLists();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
 */
NeoBuilding.prototype.isCameraInsideOfBuilding = function(eyeX, eyeY, eyeZ) 
{
	return this.metaData.bbox.isPoint3dInside(eyeX, eyeY, eyeZ);
	/*
	var intersectedOctree = this.octree.getIntersectedSubBoxByPoint3D(eyeX, eyeY, eyeZ);
	if(intersectedOctree)
	{
		if(intersectedOctree.triPolyhedronsCount > 0)
			return true;
		else
			return false;
	}
	else
		return false;
	*/
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absoluteEyeX 변수
 * @param absoluteEyeY 변수
 * @param absoluteEyeZ 변수
 * @returns point3dScrath2
 */
NeoBuilding.prototype.getTransformedRelativeEyePositionToBuilding = function(absoluteEyeX, absoluteEyeY, absoluteEyeZ, resultRelEyePosToBuilding) 
{
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;
	var relativeEyePosX = absoluteEyeX - buildingPosition.x;
	var relativeEyePosY = absoluteEyeY - buildingPosition.y;
	var relativeEyePosZ = absoluteEyeZ - buildingPosition.z;

	if (this.buildingPosMatInv === undefined) 
	{
		this.buildingPosMatInv = new Matrix4();
		this.buildingPosMatInv.setByFloat32Array(this.moveMatrixInv);
	}

	var point3dScratch = new Point3D();
	
	if (resultRelEyePosToBuilding === undefined)
	{ resultRelEyePosToBuilding = new Point3D(); }
	
	point3dScratch.set(relativeEyePosX, relativeEyePosY, relativeEyePosZ);
	resultRelEyePosToBuilding = this.buildingPosMatInv.transformPoint3D(point3dScratch, resultRelEyePosToBuilding);

	return resultRelEyePosToBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getHeaderVersion = function() 
{
	return this.metaData.version;
};


/**
 * 어떤 일을 하고 있습니까?
 * @param lod 변수
 */
NeoBuilding.prototype.getLodBuildingData = function(lod) 
{
	if (this.lodBuildingDatasMap === undefined)
	{ return undefined; }
	
	return this.lodBuildingDatasMap[lod];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getCurrentLodString = function() 
{
	var currentLodString = undefined;
	var lodBuildingData = this.getLodBuildingData(this.currentLod);
	currentLodString = lodBuildingData.geometryFileName;
	return currentLodString;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.getCurrentSkin = function() 
{
	if (this.lodMeshesMap === undefined)
	{ return undefined; }
	
	var skinLego;
	//var currLodString = this.getCurrentLodString();
	//skinLego = this.lodMeshesMap[currLodString];
	//if(skinLego)
	//var hola = 0;
	
	//return skinLego;
	
	var lodBuildingData = this.getLodBuildingData(this.currentLod);
	if (lodBuildingData === undefined)
	{ return; }
		
	//textureFileName = lodBuildingData.textureFileName;
	var lodString = lodBuildingData.geometryFileName;
	skinLego = this.lodMeshesMap[lodString];
		
	if (skinLego !== undefined && skinLego.isReadyToRender())
	{ return skinLego; }
		
	
	if (this.currentLod === 0)
	{
		skinLego = this.lodMeshesMap.lod0;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod1;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod2;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod3;
					if (skinLego === undefined || !skinLego.isReadyToRender())
					{
						skinLego = this.lodMeshesMap.lod4;
						if (skinLego === undefined || !skinLego.isReadyToRender())
						{
							skinLego = this.lodMeshesMap.lod5;
						}
					}
				}
			}
		}
		
	}
	else if (this.currentLod === 1)
	{
		skinLego = this.lodMeshesMap.lod1;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod2;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod4;
					if (skinLego === undefined || !skinLego.isReadyToRender())
					{
						skinLego = this.lodMeshesMap.lod5;
					}
				}
			}
		}
		
	}
	else if (this.currentLod === 2)
	{
		skinLego = this.lodMeshesMap.lod2;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod3;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod4;
				if (skinLego === undefined || !skinLego.isReadyToRender())
				{
					skinLego = this.lodMeshesMap.lod5;
				}
			}
		}
		
	}
	else if (this.currentLod === 3)
	{
		skinLego = this.lodMeshesMap.lod3;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod4;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod5;
			}
		}
		
	}
	else if (this.currentLod === 4)
	{
		skinLego = this.lodMeshesMap.lod4;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod5;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
			}
		}
		
	}
	else if (this.currentLod === 5)
	{
		skinLego = this.lodMeshesMap.lod5;
		
		if (skinLego === undefined || !skinLego.isReadyToRender())
		{
			skinLego = this.lodMeshesMap.lod4;
			if (skinLego === undefined || !skinLego.isReadyToRender())
			{
				skinLego = this.lodMeshesMap.lod3;
			}
		}
		
	}

	return skinLego;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference 변수
 */
NeoBuilding.prototype.manageNeoReferenceTexture = function(neoReference, magoManager) 
{
	var texture = undefined;
	
	if (this.metaData.version[0] === "v")
	{
		// this is the version beta.
		if (neoReference.texture === undefined)
		{ return undefined; }
		
		if (neoReference.texture.texId === undefined && neoReference.texture.textureImageFileName !== "") 
		{
			// 1rst, check if the texture is loaded.
			if (this.texturesLoaded === undefined)
			{ this.texturesLoaded = []; }
			
			var sameTexture = this.getSameTexture(neoReference.texture);
			if (sameTexture === undefined)
			{
				if (magoManager.backGround_fileReadings_count > 10) 
				{ return; }
			
				if (neoReference.texture.fileLoadState === CODE.fileLoadState.READY) 
				{
					var gl = magoManager.sceneState.gl;
					neoReference.texture.texId = gl.createTexture();
					// Load the texture.***
					var projectFolderName = this.projectFolderName;
					var geometryDataPath = magoManager.readerWriter.geometryDataPath;
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + this.buildingFileName + "/Images_Resized/" + neoReference.texture.textureImageFileName;

					this.texturesLoaded.push(neoReference.texture);
					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, neoReference.texture, this, magoManager);
					magoManager.backGround_fileReadings_count ++;
				}
			}
			else 
			{
				if (sameTexture.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
				{
					neoReference.texture = sameTexture;
				}
			}
		}
		
		return neoReference.texture.fileLoadState;
	}
	else if (this.metaData.version[0] === '0' && this.metaData.version[2] === '0' && this.metaData.version[4] === '1' )
	{
		if (neoReference.texture === undefined || neoReference.texture.fileLoadState === CODE.fileLoadState.READY)
		{
			// provisionally use materialId as textureId.
			var textureId = neoReference.materialId;
			texture = this.texturesLoaded[textureId];
			neoReference.texture = texture;
			
			if (texture.texId === undefined && texture.textureImageFileName !== "")
			{
				if (magoManager.backGround_fileReadings_count > 10) 
				{ return undefined; }
	
				if (texture.fileLoadState === CODE.fileLoadState.READY) 
				{
					var gl = magoManager.sceneState.gl;
					texture.texId = gl.createTexture();
					// Load the texture.***
					var projectFolderName = this.projectFolderName;
					var geometryDataPath = magoManager.readerWriter.getCurrentDataPath();
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + this.buildingFileName + "/Images_Resized/" + texture.textureImageFileName;

					magoManager.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, texture, this, magoManager);
					magoManager.backGround_fileReadings_count ++;
				}
			}
		}
		
		return neoReference.texture.fileLoadState;
	}
	
};

