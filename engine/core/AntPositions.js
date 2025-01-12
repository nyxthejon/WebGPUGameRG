export let AntTransforms = [];

export function RefillTransforms()
{
        AntTransforms = [
        { translation: [7.651292324066162, 0, 2.269230842590332] },
        { translation: [-20.1975784310578, 0, 4.30729341506958] },
        { translation: [4.136887550354004, 0, -0.610131561756134] },
        { translation: [-34.5145877600195, 0, 25.207897186279297] },
        { translation: [-34.03273850830078, 0, -0.039002415813066406] },
        { translation: [-11.6274646428202, 0, 17.62200355529785] },
        { translation: [-3.120896339416504, 0, -4.330191612243652] },
        { translation: [-7.28834867477417, 0, 10.119948673248291] },
        { translation: [-3.880815153840835, 0, 23.88152313232422] },
        { translation: [-31.140148162841797, 0, -11.455536842346191] },
        { translation: [0.3087424043562117, 0, -3.624770164489746] },
        { translation: [-3.43075123699951, 0, 5.871939377027754] },
        { translation: [-4.43868424042703, 0, -4.30287561104915] },
        { translation: [-31.29949348203, 0, 18.80669212431086] },
        { translation: [-36.58922888035991, 0, 3.957293174959961] },
        { translation: [-16.29499626159668, 0, 20.94097518209894] },
        { translation: [-3.120896339416504, 0, -8.412511825561523] },
        { translation: [-35.06201553344266, 0, -13.818978309631438] },
        { translation: [4.114720821380615, 0, 20.102619171142578] },
        { translation: [7.192551136016846, 0, -0.328770648712158] },
        { translation: [-3.8886348963926, 0, 14.3033447265625] },
        { translation: [-31.2994949482803, 0, 25.06748205566406] },
        { translation: [-5.78127794342041, 0, 5.760035514813154] },
        { translation: [-15.13281059251367, 0, 18.22782516479492] },
        { translation: [-9.48011583588184, 0, -8.412511825561523] },
        { translation: [-11.11244535459898, 0, -16.72046661376953] },
        { translation: [-13.52964687344721, 0, 28.578384399414062] },
        { translation: [-29.74436378479004, 0, -21.03496032371844] },
    ];
}


function returnLength()
{
    return AntTransforms.length;
}

export function getRandomAndRemove() {
    const randomIndex = Math.floor(Math.random() * returnLength()); 
    const randomItem = AntTransforms[randomIndex]; 
    AntTransforms.splice(randomIndex, 1); 
    return randomItem; 
}
