import mongoose from 'mongoose';

const EnvioSchema = mongoose.Schema({
    id_user:{
        type: String,
        required: true,
        unique: true,
    },
    direccion:{
        type: String,
        required: true
    },
    ciudad:{
        type: String,
        required: true
    },
    fechaEnvio:{
        type: Date,
        required: true,
        default: Date.now
    },
    fechaAproxEntrega:{
        type: Date,
        required: true,
        default: Date.now
    },
    costo:{
        type: String,
        required: true
    },
    estado:{
        type: String,
        required: true
    },
    descripcion:{
        type: String,
        required: true,
    },
})

export default mongoose.model('Envio', EnvioSchema);