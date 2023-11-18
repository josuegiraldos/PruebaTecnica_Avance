import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const ddbb = process.env.MONGO_URI;
const nombreDB = "Avance";
const client = new MongoClient(ddbb);

const connectToMongo = async (nameCollection) => {
  try {
    await client.connect();
    const db = client.db(nombreDB);
    const collection = db.collection(nameCollection);
    return collection;
  } catch (error) {
    throw new Error(error, "Error al conectar a la base de datos.");
  }
};

const endpoint1 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "numeracion",
            localField: "idnumeracion",
            foreignField: "_id",
            as: "numeracion_data",
          },
        },
        {
          $unwind: "$numeracion_data",
        },
        {
          $lookup: {
            from: "empresa",
            localField: "numeracion_data.idempresa",
            foreignField: "_id",
            as: "empresa_data",
          },
        },
        {
          $unwind: "$empresa_data",
        },
        {
          $lookup: {
            from: "estado",
            localField: "idestado",
            foreignField: "_id",
            as: "estado_data",
          },
        },
        {
          $unwind: "$estado_data",
        },
        {
          $group: {
            _id: "$empresa_data.razonsocial",
            documentos_exitosos: {
              $sum: {
                $cond: {
                  if: { $eq: ["$estado_data.exitoso", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            documentos_fallidos: {
              $sum: {
                $cond: {
                  if: { $eq: ["$estado_data.exitoso", false] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $match: {
            $expr: { $lt: ["$documentos_exitosos", "$documentos_fallidos"] },
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar las empresas que tienen más documentos fallidos que exitosos.",
      result,
    });
  } catch (error) {
    console.log(
      "Error al listar las empresas que tienen más documentos fallidos que exitosos.",
      error
    );
    res.status(500).json({
      msg: "Error al listar las empresas que tienen más documentos fallidos que exitosos.",
    });
  }
};

const endpoint2 = async (req, res) => {
  try {
    const collection = await connectToMongo("numeracion");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "empresa",
            localField: "idempresa",
            foreignField: "_id",
            as: "empresa_data",
          },
        },
        {
          $unwind: "$empresa_data",
        },
        {
          $match: {
            $or: [
              {
                $and: [
                  { vigenciainicial: { $lte: new Date("2023-05-01") } },
                  { vigenciafinal: { $gte: new Date("2023-03-01") } },
                ],
              },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            empresa: "$empresa_data.razonsocial",
            tipo_documento: {
              $cond: {
                if: { $eq: ["$prefijo", "FAC"] },
                then: "Factura",
                else: {
                  $cond: {
                    if: { $eq: ["$prefijo", "NDE"] },
                    then: "Nota Débito",
                    else: "Nota Crédito",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: { empresa: "$empresa", tipo_documento: "$tipo_documento" },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.empresa",
            documentos: {
              $push: {
                tipo_documento: "$_id.tipo_documento",
                cantidad: "$count",
              },
            },
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar todas las empresas y cuantas facturas, notas débito y notas crédito se han generado entre dos fechas dadas. Fechas dadas: 2023-03-01 - 2023-05-01",
      result,
    });
  } catch (error) {
    console.log(
      error,
      "Error al Listar todas las empresas y cuantas facturas, notas débito y notas crédito se han generado entre dos fechas dadas. Fechas dadas: 2023-03-01 - 2023-05-01"
    );
    res.status(500).json({
      msg: "Error al Listar todas las empresas y cuantas facturas, notas débito y notas crédito se han generado entre dos fechas dadas. Fechas dadas: 2023-03-01 - 2023-05-01",
    });
  }
};

const endpoint3 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "numeracion",
            localField: "idnumeracion",
            foreignField: "_id",
            as: "numeracion_data",
          },
        },
        {
          $unwind: "$numeracion_data",
        },
        {
          $lookup: {
            from: "empresa",
            localField: "numeracion_data.idempresa",
            foreignField: "_id",
            as: "empresa_data",
          },
        },
        {
          $unwind: "$empresa_data",
        },
        {
          $lookup: {
            from: "estado",
            localField: "idestado",
            foreignField: "_id",
            as: "estado_data",
          },
        },
        {
          $unwind: "$estado_data",
        },
        {
          $group: {
            _id: {
              empresa: "$empresa_data.razonsocial",
              estado: "$estado_data.descripcion",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.empresa",
            estados: {
              $push: { estado: "$_id.estado", cantidad: "$count" },
            },
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar todas las empresas y por cada una, la cantidad de documentos que están en cada uno de los estados.",
      result,
    });
  } catch (error) {
    console.log(
      error,
      "Error al listar todas las empresas y por cada una, la cantidad de documentos que están en cada uno de los estados."
    );
    res.status(500).json({
      msg: "Error al listar todas las empresas y por cada una, la cantidad de documentos que están en cada uno de los estados.",
    });
  }
};

const endpoint4 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "numeracion",
            localField: "idnumeracion",
            foreignField: "_id",
            as: "numeracion_data",
          },
        },
        { $unwind: "$numeracion_data" },
        {
          $lookup: {
            from: "empresa",
            localField: "numeracion_data.idempresa",
            foreignField: "_id",
            as: "empresa_data",
          },
        },
        {
          $lookup: {
            from: "estado",
            localField: "idestado",
            foreignField: "_id",
            as: "estado_data",
          },
        },
        { $unwind: "$estado_data" },
        {
          $match: {
            "estado_data.exitoso": false,
          },
        },
        {
          $group: {
            _id: "$empresa_data.razonsocial",
            total_documentos_no_exitosos: { $sum: 1 },
          },
        },
        {
          $match: {
            total_documentos_no_exitosos: { $gt: 3 },
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar empresas que tienen más de 3 documentos no exitosos.",
      result,
    });
  } catch (error) {
    console.log(
      error,
      "Error al listar empresas que tienen más de 3 documentos no exitosos."
    );
    res.status(500).json({
      msg: "Error al listar empresas que tienen más de 3 documentos no exitosos.",
    });
  }
};

const endpoint5 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "numeracion",
            localField: "idnumeracion",
            foreignField: "_id",
            as: "numeracion_data",
          },
        },
        {
          $unwind: "$numeracion_data",
        },
        {
          $addFields: {
            estado_vigencia: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$numero", "$numeracion_data.consecuticofinal"] },
                    {
                      $lte: ["$numero", "$numeracion_data.consecutivoinicial"],
                    },
                  ],
                },
                "Dentro de vigencia",
                "Fuera de vigencia",
              ],
            },
          },
        },
        {
          $match: {
            estado_vigencia: "Fuera de vigencia",
          },
        },
        {
          $project: {
            iddocumento: "$_id",
            idnumeracion: 1,
            numero: 1,
            estado_vigencia: 1,
            "numeracion_data.consecutivoinicial": 1,
            "numeracion_data.consecutivofinal": 1,
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar por cada empresa, cuantos documentos tiene número por fuera del rango permitido por la DIAN.",
      result,
    });
  } catch (error) {
    console.log(
      "Error al listar por cada empresa, cuantos documentos tiene número por fuera del rango permitido por la DIAN."
    );
    res.status(500).json({
      msg: "Error al listar por cada empresa, cuantos documentos tiene número por fuera del rango permitido por la DIAN.",
    });
  }
};

const endpoint6 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection
      .aggregate([
        {
          $lookup: {
            from: "numeracion",
            localField: "idnumeracion",
            foreignField: "_id",
            as: "numeracion_data",
          },
        },
        {
          $unwind: "$numeracion_data",
        },
        {
          $match: {
            "numeracion_data.prefijo": { $in: ["FAC", "NDE"] }, // Filtrar facturas y notas débito
          },
        },
        {
          $group: {
            _id: {
              empresa: "$numeracion_data.idempresa",
              tipo_documento: "$numeracion_data.prefijo",
            },
            total_dinero_recibido: { $sum: { $add: ["$base", "$impuestos"] } },
          },
        },
        {
          $match: {
            "_id.tipo_documento": { $in: ["FAC", "NDE"] }, // Filtrar facturas y notas débito
          },
        },
        {
          $group: {
            _id: "$_id.empresa",
            total_dinero_recibido: { $sum: "$total_dinero_recibido" },
          },
        },
        {
          $lookup: {
            from: "empresa",
            localField: "_id",
            foreignField: "_id",
            as: "empresa_data",
          },
        },
        {
          $unwind: "$empresa_data",
        },
        {
          $project: {
            _id: 0,
            empresa: "$empresa_data.razonsocial",
            total_dinero_recibido: 1,
          },
        },
      ])
      .toArray();
    res.status(202).json({
      msg: "Listar todas las empresas y el total de dinero recibido (base+impuestos). No incluya las notas crédito pues esas relacionan dinero que sale, no que entra.",
      result,
    });
  } catch (error) {
    console.log(
      error,
      "Error al Listar todas las empresas y el total de dinero recibido (base+impuestos)."
    );
    res.status(500).json({
      msg: "Error al Listar todas las empresas y el total de dinero recibido (base+impuestos)."
    })
  }
};

const endpoint7 = async (req, res) => {
  try {
    const collection = await connectToMongo("documento");
    const result = await collection.aggregate([
      {
        $lookup: {
          from: "numeracion",
          localField: "idnumeracion",
          foreignField: "_id",
          as: "numeracion_data"
        }
      },
      {
        $unwind: "$numeracion_data"
      },
      {
        $lookup: {
          from: "empresa",
          localField: "numeracion_data.idempresa",
          foreignField: "_id",
          as: "empresa_data"
        }
      },
      {
        $unwind: "$empresa_data"
      },
      {
        $addFields: {
          numero_completo: {
            $concat: ["$numeracion_data.prefijo", { $toString: "$numero" }]
          }
        }
      },
      {
        $group: {
          _id: "$numero_completo",
          cantidad_repeticiones: { $sum: 1 },
          empresas: { $addToSet: "$empresa_data.razonsocial" }
        }
      },
      {
        $match: {
          cantidad_repeticiones: { $gt: 1 }
        }
      }
    ]).toArray();
    res.status(202).json({
      msg: "Teniendo en cuenta que el “número completo” de un documento es la concatenación de su prefijo y su número (ejemplo prefijo PRUE, número 654987, numero completo es PRUE654987), determine si hay algún “número completo” repetido en la base de datos (dos empresas pueden tener numeraciones con el mismo prefijo) y cuantas veces se repite.",
      result
    });
  } catch (error) {
    console.log(error, "Error endpoint7.");
    res.status(500).json({
      msg: "Error al obtener los datos del endpoint7."
    })
  }
}

export { endpoint1, endpoint2, endpoint3, endpoint4, endpoint5, endpoint6, endpoint7 };
