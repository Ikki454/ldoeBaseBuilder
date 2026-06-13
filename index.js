let currentBuilding = null;
let ressourceFilter = '';

let noBuildableColor = '#9c1f1f';
let buildableColor = '#3c5f35';
let borderColor = '1px solid #546b4a';

let previousCell;
let previousSide = null;

const buildingGrid = document.querySelector(".building-grid");
const baseGrid = document.querySelector(".base-grid");
const ressourceList = document.querySelector(".ressource-list");

let ressourcesList = [];
let ressourcesDenie = [];

let enableBuildings = false;
let enableProps = false;

let buildingMap;
let ressourceMap;

//clear dropdown
const clearBtns = document.querySelectorAll(".c-dropdown-btn");
clearBtns.forEach(input => {
    input.addEventListener("click", () => {

        const filterValue = input.id.toLowerCase();

        switch (filterValue) {
            case 'del-base-plan':
                baseGrid.innerHTML = '';
                generateBasePlan();
                ressourceList.innerHTML = '';
                ressourcesDenie = [];
                break;

            case 'reset-ressources':
                ressourcesDenie = ressourcesList;
                ressourceList.innerHTML = '';
                break;

            case 'enable-buildings':
                enableBuildings = !enableBuildings;
                enableConstruction();
                break;

            case 'enable-props':
                enableProps = !enableProps;
                enableConstruction();
                break;
        }
    });
});
//building Filter dropdown
const filterBtn = document.querySelectorAll(".b-dropdown-btn");
filterBtn.forEach(input => {
    input.addEventListener("click", () => {

        const filterValue = input.id.toLowerCase();

        if (filterValue === "all") {
            generateBuildings(Array.from(buildingMap.values()));
            return;
        }
        
        generateBuildings(Array.from(buildingMap.values()).filter(b => b.buildingType === filterValue));
    });
});
//ressource Filter dropdown
const filterRessourceBtn = document.querySelectorAll(".r-dropdown-btn");
filterRessourceBtn.forEach(input => {
    input.addEventListener("click", () => {

        ressourceFilter = input.id.toLowerCase();
        totalRessourceUsed(ressourceFilter);
    });
});


async function loadData() {
    const response = await fetch("data.json");
    let data = await response.json();

    buildingMap = new Map(data.buildings.map(b => [b.name, b]));
    ressourceMap = new Map(data.ressources.map(r => [r.name, r]));

    generateBuildings(data.buildings);
    generateBasePlan();
}


function generateBuildings(buildings) {

    buildingGrid.innerHTML = '';

    for (const building of buildings) {

        const cell = document.createElement("button");

        cell.className = "building-cell";
        cell.dataset.name = building.name;

        cell.addEventListener("click", onClickBuilding);

        cell.innerHTML = `
            <img
                class="building-image"
                src="${building.visual}"
                alt="${building.name}"
                width="65"
                height="65"
            >
            <p>${building.name}</p>
        `;

        buildingGrid.appendChild(cell);
    }
}
function generateBasePlan() {
    const baseGrid = document.querySelector('.base-grid');

    const num = [12, 13, 14, 15];

    for (let i = 0; i < 18; i++) {
        for (let j = 0; j < 18; j++) {
            const baseCell = document.createElement('button');
            baseCell.classList.add('base-cell');

            baseCell.addEventListener('click', onClickBaseCell);
            
            baseCell.addEventListener("mousemove", onMouseOverBaseCell);

            if (num.includes(j) && i > 12) {
                baseCell.style.backgroundColor = noBuildableColor;
                baseCell.dataset.noBuild = 'true';
            }else {
                baseCell.style.backgroundColor = buildableColor;
            }
            baseCell.dataset.index = i * 18 + j;

            const propsVisual = document.createElement('img');
            propsVisual.style.opacity = 0.0;

            baseGrid.appendChild(baseCell);
            baseCell.appendChild(propsVisual);
        }
    }
}
function generateRessources(ressources) {
    ressourceList.innerHTML = '';

    //denie ressource
    const currentMap = new Map(
        ressourcesDenie.map(r => [r.name, r.quantity])
    );

    const resultRessources = ressources.map(r => ({
        name: r.name,
        visual: r.visual,
        quantity: r.quantity - (currentMap.get(r.name) ?? 0)
    }));

    //show ressourece list - denie
    for (const r of resultRessources) {

        if (r.quantity < 0) continue;
        const ressourceItem = document.createElement('li');

        const article = document.createElement('div');

        const ressourceImage = document.createElement('img');
        ressourceImage.src = r.visual;
        ressourceImage.alt = `image of ${r.name}`;
        ressourceImage.height = 50;
        ressourceImage.width = 50;

        const ressourceName = document.createElement('p');
        ressourceName.innerText = r.name;

        const quantity = document.createElement('p');
        quantity.innerText = `x${r.quantity}`;
        
        ressourceList.appendChild(ressourceItem);

        ressourceItem.appendChild(article);
        ressourceItem.appendChild(quantity);

        article.appendChild(ressourceImage);
        article.appendChild(ressourceName);
    }
}

function onClickBuilding(event) {
    const target = event.currentTarget;

    document.querySelector(".building-cell.selected")?.classList.remove("selected");
    
    target.classList.add('selected');

    currentBuilding = target.dataset.name;

    for (const cell of baseGrid.children) {

        clearBorders(cell.dataset.index);

        if (!cell.dataset.building) {
            cell.style.backgroundColor = cell.dataset.noBuild ? noBuildableColor : buildableColor;
        }

        if (!cell.dataset.props) {
            const cellVisual = cell.querySelector('img');
            cellVisual.src = '';
            cellVisual.style.opacity = 0;
        }
    }
}
function onClickBaseCell(event) {

    const targetCell = event.currentTarget;

    if (targetCell.dataset.noBuild) return;
    
    if (currentBuilding !== null) {
        const building = buildingMap.get(currentBuilding);

        switch (building.type) {

            case 'wall':
                const index = targetCell.dataset.index;
                const side = getClosestBorder(targetCell, event.clientX, event.clientY);
                const neighborCell = getNeighborCell(index, side);

                drawBorder(side, targetCell, neighborCell, `3px solid ${building.color}`);
                    
                switch (side) {
                    case 'top':
                        targetCell.dataset.buildingTop = building.name;
                        if (neighborCell) neighborCell.dataset.buildingBottom = building.name;     
                        break;
                    case 'bottom':
                        targetCell.dataset.buildingBottom = building.name;
                        if (neighborCell) neighborCell.dataset.buildingTop = building.name;
                        break;
                    case 'left':
                        targetCell.dataset.buildingLeft = building.name;
                        if (neighborCell) neighborCell.dataset.buildingRight = building.name;
                        break;
                    case 'right':
                        targetCell.dataset.buildingRight = building.name;
                        if (neighborCell) neighborCell.dataset.buildingLeft = building.name;
                        break;
                }
                break;

            case 'floor':
                targetCell.style.backgroundColor = building.color;
                targetCell.dataset.building = building.name;
                break;

            case 'props':
                const propsVisual = targetCell.querySelector('img');

                propsVisual.src = building.visual;
                propsVisual.style.opacity = 1.0;

                targetCell.dataset.props = building.name;
                break;
        }

        totalRessourceUsed(ressourceFilter);
    }
    else {
        alert('Please select a building first');
    }
}

function onMouseOverBaseCell(event) {
    if (!currentBuilding) return;

    const targetCell = event.currentTarget;

    //no buildable cell
    if (targetCell.dataset.noBuild) {

        const preCell = document.querySelector(`.base-grid`).children[previousCell];

        if (!preCell.dataset.building) {
            preCell.style.backgroundColor = buildableColor;
        }

        if (!preCell.dataset.props) {
            const preCellVisual = preCell.querySelector('img');
            preCellVisual.style.opacity = 0;
        }

        clearBorders(targetCell.dataset.index);
        return;
    }

    const building = buildingMap.get(currentBuilding);
    const index = targetCell.dataset.index;

    switch(building.type) {
         case 'floor':

            //clear previous cell if exist and different from current
            if (previousCell) {
                if (index !== previousCell) {

                    const preCell = document.querySelector(`.base-grid`).children[previousCell];
                    if (!preCell.dataset.building)  {
                        preCell.style.backgroundColor = 
                        preCell.dataset.noBuild === 'true' ? noBuildableColor : buildableColor;
                    }
                    else {
                        if (enableBuildings) {
                            preCell.style.backgroundColor = 
                            preCell.dataset.noBuild ? noBuildableColor : buildableColor;
                        }
                        else{
                            const preBuilding = buildingMap.get(preCell.dataset.building);
                            if (preBuilding !== building) {
                                preCell.style.backgroundColor = preBuilding.color;
                            }
                        }
                    }
                }
            }

            targetCell.style.backgroundColor = building.color;

            previousCell = index;
            break;

        case 'wall':

            const side = getClosestBorder(targetCell, event.clientX, event.clientY);
            const neighborCell = getNeighborCell(index, side);

            //clear previous cell if exist and different from current
            if (previousCell) {
                if (index !== previousCell) {
                    clearBorders(previousCell);
                }
            }
            clearBorders(index);

            drawBorder(side, targetCell, neighborCell, `3px solid ${building.color}`);

            previousCell = index;
            break;

        case 'props':

            //clear previous cell if exist and different from current
            if (previousCell) {
                if (index !== previousCell) {

                    const preCell = document.querySelector(`.base-grid`).children[previousCell];
                    const preCellVisual = preCell.querySelector('img');

                    if (!preCell.dataset.props)  {
                        preCellVisual.src = null;
                        preCellVisual.style.opacity = 0;
                    }
                    else {
                        if (enableProps) {
                            preCellVisual.style.opacity = 0;
                        }
                        else{
                            const preProps = buildingMap.get(preCell.dataset.props);
                            if (preProps !== building) {

                                preCellVisual.src = preProps.visual;
                                preCellVisual.style.opacity = 1;
                            }
                        }
                    }
                }
            }

            const propsVisual = targetCell.querySelector('img');

            propsVisual.src = building.visual;
            propsVisual.style.opacity = 1.0;

            previousCell = index;
            break;
    }   
}

function drawBorder(side, cell, neighborCell, color) {
    switch (side) {
        case 'top':
            cell.style.borderTop = color;
            if (neighborCell) neighborCell.style.borderBottom = color;
            break;
        case 'bottom':
            cell.style.borderBottom = color;
            if (neighborCell) neighborCell.style.borderTop = color;
            break;
        case 'left':
            cell.style.borderLeft = color;
            if (neighborCell) neighborCell.style.borderRight = color;
            break;
        case 'right':
            cell.style.borderRight = color;
            if (neighborCell) neighborCell.style.borderLeft = color;
            break;
    }
}

function clearBorders(index) {

    const grid = document.querySelector(".base-grid");

    const leftCell = getNeighborCell(index, 'left');
    const rightCell = getNeighborCell(index, 'right');
    const topCell = getNeighborCell(index, 'top');
    const bottomCell = getNeighborCell(index, 'bottom');

    clearAllBorders(grid.children[index]);

    if (leftCell) clearAllBorders(leftCell);
    if (rightCell) clearAllBorders(rightCell);
    if (topCell) clearAllBorders(topCell);
    if (bottomCell) clearAllBorders(bottomCell);
}
function clearAllBorders(cell) {

    if (!cell) return;
         
    if (!cell.dataset.buildingTop) {
        cell.style.borderTop = borderColor;
    }
    else {
        cell.style.borderTop = enableBuildings ? borderColor :
            `3px solid ${buildingMap.get(cell.dataset.buildingTop).color}`;
    }

    if (!cell.dataset.buildingBottom) {
        cell.style.borderBottom = borderColor;
    }
    else {
        cell.style.borderBottom = enableBuildings ? borderColor :
            `3px solid ${buildingMap.get(cell.dataset.buildingBottom).color}`;
    }

    if (!cell.dataset.buildingLeft) {
        cell.style.borderLeft = borderColor;
    }
    else {
        cell.style.borderLeft = enableBuildings ? borderColor :
            `3px solid ${buildingMap.get(cell.dataset.buildingLeft).color}`;
    }

    if (!cell.dataset.buildingRight) {
        cell.style.borderRight = borderColor;
    }
    else {
        cell.style.borderRight = enableBuildings ? borderColor :
            `3px solid ${buildingMap.get(cell.dataset.buildingRight).color}`;
    }
}

function getClosestBorder(element, mouseX, mouseY) {

    const r = element.getBoundingClientRect();

    const distances = {
        top: mouseY - r.top,
        bottom: r.bottom - mouseY,
        left: mouseX - r.left,
        right: r.right - mouseX
    };

    return Object.entries(distances).sort((a, b) => a[1] - b[1])[0][0];
}
function getNeighborCell(index, side) {

    index = Number(index);

    const row = Math.floor(index / 18);
    const col = index % 18;

    switch (side) {

        case "top":
            return row > 0 ? baseGrid.children[index - 18] : null;

        case "bottom":
            return row < 17 ? baseGrid.children[index + 18] : null;

        case "left":
            return col > 0 ? baseGrid.children[index - 1] : null;

        case "right":
            return col < 17 ? baseGrid.children[index + 1] : null;
    }

    return null;
}

function totalRessourceUsed(filter) {

    const ressourcesUsed = new Map();

    //add all vonstruction cost to ressourcesUsed
    for (const cell of baseGrid.children) {

        const building = cell.dataset.building;
        const buildingProps = cell.dataset.props;

        const buildingTop = cell.dataset.buildingTop;
        const buildingBottom = cell.dataset.buildingBottom;
        const buildingLeft = cell.dataset.buildingLeft;
        const buildingRight = cell.dataset.buildingRight;
        
        const index = cell.dataset.index;
        const row = Math.floor(index / 18);
        const col = index % 18;

        addBuilding(building, ressourcesUsed);
        addBuilding(buildingProps, ressourcesUsed);

        if (row === 0 && col === 0) {
            addBuilding(buildingTop, ressourcesUsed);
            addBuilding(buildingBottom, ressourcesUsed);
            addBuilding(buildingLeft, ressourcesUsed);
            addBuilding(buildingRight, ressourcesUsed);
            continue;
        }
        
        if (row === 0) {
            addBuilding(buildingTop, ressourcesUsed);
            addBuilding(buildingBottom, ressourcesUsed);
            addBuilding(buildingRight, ressourcesUsed);
            continue;
        }
        
        if (col === 0) {
            addBuilding(buildingBottom, ressourcesUsed);
            addBuilding(buildingLeft, ressourcesUsed);
            addBuilding(buildingRight, ressourcesUsed);
            continue;
        }

        addBuilding(buildingBottom, ressourcesUsed);
        addBuilding(buildingRight, ressourcesUsed);
    }

    ressourcesList = Array.from(ressourcesUsed.values());

    //manage ressource filter
    if (filter !== '') {

        switch (filter) {
            case "quantity-asc":
                ressourcesList.sort((a, b) => a.quantity - b.quantity);
                break;

            case "quantity-desc":
                ressourcesList.sort((a, b) => b.quantity - a.quantity);
                break;

            case "name-asc":
                ressourcesList.sort((a, b) => a.name.localeCompare(b.name));
                break;

            case "name-desc":
                ressourcesList.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        generateRessources(ressourcesList);

    }
    else{
        generateRessources(ressourcesList);
    }
}
function addBuilding(buildingName, ressourcesUsed) {

    if (!buildingName || buildingName === "none" || buildingName === "null") return;

    const building = buildingMap.get(buildingName);

    if (!building) return;

    for (const material of building.cost) {

        const existing = ressourcesUsed.get(material.name);

        if (existing) {

            existing.quantity += material.quantity;
        }
        else {

            const ressourceData = ressourceMap.get(material.name);

            if (!ressourceData) return;

            ressourcesUsed.set(material.name, {
                name: ressourceData.name,
                visual: ressourceData.visual,
                quantity: material.quantity
            });
        }
    }
}

function enableConstruction() {
    for (const cell of baseGrid.children) {

        if (enableBuildings) {

            cell.style.backgroundColor = cell.dataset.noBuild ? noBuildableColor : buildableColor;
        }
        else {
            if (cell.dataset.building) {
                const build = buildingMap.get(cell.dataset.building);
                cell.style.backgroundColor = build.color;
            }
        }

        clearAllBorders(cell);

        const cellVisual = cell.querySelector('img');
        cellVisual.style.opacity = enableProps ? 0 : !cell.dataset.props ? 0 : 1;
    }
}

loadData();