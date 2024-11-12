import amqp from "amqplib";
import Envio from "../models/envio.model.js";
import Producer from "../producer.js";

const producer = new Producer();

export async function consumeMessages() {
  try {
    // Establecer conexión con RabbitMQ
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchange = "logExchange"; // Nombre del exchange
    const queue = ""; // Deja la cola sin nombre para que RabbitMQ asigne una cola temporal única

    // Declara el exchange como tipo 'fanout'
    await channel.assertExchange(exchange, "fanout", { durable: true });

    // Crea una cola temporal y enlázala al exchange
    const q = await channel.assertQueue(queue, { exclusive: true });

    // Vincula la cola al exchange sin usar `routingKey`, ya que es un fanout exchange
    await channel.bindQueue(q.queue, exchange, "");

    console.log("Esperando mensajes en la cola para iniciar con los puntos...");

    // Consumir mensajes de la cola
    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        console.log("Datos recibidos:", data);

        const identificacion = data.user.identificacion;
        const direccion = data.user.direccion;
        const ciudad = data.user.ciudad;
        const correo = data.user.correo;
        const nombres = data.user.nombres;

        // Llamar a la función sendEmail con el correo del usuario
        try {
          await registerEnvioWelcome(
            identificacion,
            direccion,
            ciudad,
            correo,
            nombres
          );
        } catch (error) {
          console.error("Error al inicializar puntos", error);
        }

        channel.ack(msg); // Confirmar que el mensaje fue procesado
      }
    });
  } catch (error) {
    console.error("Error al consumir los mensajes:", error);
  }
}

export const registerEnvioWelcome = async (
  identificacion,
  direccion,
  ciudad,
  correo,
  nombres
) => {
  try {
    // Establecer la fecha de envío como la fecha actual (hoy)
    const fechaEnvio = new Date(); // Fecha actual

    // Calcular la fecha aproximada de entrega sumando 5 días a la fecha de envío
    const fechaAproxEntrega = new Date(fechaEnvio);
    fechaAproxEntrega.setDate(fechaEnvio.getDate() + 5); // Sumar 5 días a la fecha de envío

    // Establecer valores predeterminados o calcular dinámicamente
    const costo = "10000"; // Puedes cambiar esto por la lógica de cálculo del costo si es necesario
    const estado = "Pendiente"; // El estado inicial del envío
    const descripcion = "Envío de bienvenida"; // Descripción del envío de bienvenida

    // Crear una nueva instancia de Envio
    const nuevoEnvio = new Envio({
      id_user: identificacion,
      direccion: direccion,
      ciudad: ciudad,
      fechaEnvio: fechaEnvio,
      fechaAproxEntrega: fechaAproxEntrega,
      costo: costo,
      estado: estado,
      descripcion: descripcion,
    });

    // Guardar la nueva instancia en la base de datos
    await nuevoEnvio.save();

    try {
      await producer.publishMessage({
        message: "Nuevo Envio Registrado",
        user: {
          id: nuevoEnvio._id,
          direccion: nuevoEnvio.direccion,
          ciudad: nuevoEnvio.ciudad,
          fechaEnvio: nuevoEnvio.fechaEnvio,
          fechaAproxEntrega: nuevoEnvio.fechaAproxEntrega,
          costo: nuevoEnvio.costo,
          estado: nuevoEnvio.estado,
          descripcion: nuevoEnvio.descripcion,
          correo: correo,
          nombres: nombres,
        },
      });
      console.log(
        "Mensaje enviado a RabbitMQ para enviar correo de envio de paquete de bienvenida"
      );
    } catch (rabbitError) {
      console.error("Error al enviar mensaje a RabbitMQ:", rabbitError);
    }
    console.log("Envío de bienvenida registrado con éxito");
    return { message: "Envío registrado con éxito", envio: nuevoEnvio };
  } catch (error) {
    console.error("Error al registrar el envío:", error);
    throw new Error("Error al registrar el envío");
  }
};

export const getEnvioUser = async (req, res) => {
 const { identificacion } = req.params; // O req.query o req.body según cómo envíes el dato
 console.log("req.params", req.params);   
 console.log("identificacion", identificacion);
 try {
    const envio = await Envio.find({ id_user: identificacion });
    if (!envio || envio.length === 0) {
      return res.status(404).json({ message: "No se encontró el envío" });
    }
    res.json(envio);
  } catch (error) {
    console.error("Error al obtener el envío:", error);
    res.status(500).json({ message: "Error al obtener el envío" });
  }
};
