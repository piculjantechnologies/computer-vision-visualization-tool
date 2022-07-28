from flask import Flask, jsonify
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)

@app.route('/upload/<url>/', methods=["POST"])
def colors(palette):
    """Endpoint returing a prediction object
    ---
    parameters:
      - name: URL
        in: path
        type: string
        required: true
        description: Path to the image
    definitions:
        Response:
            type: object
            properties:
                result:
                    type: object
                    properties:
                        datetime:
                            type: string
                        face_analysis:
                            type: array
                            items:
                                $ref: '#/definitions/FaceRef'
                        hash:
                            type: string
                        height:
                            type: number
                        object_analysis:
                            type: array
                            items:
                                $ref: '#/definitions/ObjectRef'
                        pose_estimation_analysis:
                            type: array
                            items:
                                $ref: '#/definitions/PoseRef'
                        type:
                          type: string
                        url:
                            type: string
                        width:
                            type: number
        FaceRef:
            type: array
            items:
                $ref: '#/definitions/FaceRefItem'
        FaceRefItem:
            type: object
            properties:
                bounding_box_confidence:
                    type: float
                distance:
                    type: number
                identity:
                    type: null
                x1:
                    type: number
                x2:
                    type: number
                y1:
                    type: number
                y2:
                    type: number

        ObjectRef:
            type: array
            items:
                $ref: '#/definitions/ObjectRefItem'
        ObjectRefItem:
            type: object
            properties:
                classname:
                    type: string
                cls_conf:
                    type: float
                conf:
                    type: float
                x1:
                    type: number
                x2:
                    type: number
                y1:
                    type: number
                y2:
                    type: number

        PoseRef:
            type: array
            items:
                $ref: '#/definitions/PoseRefItem'
        PoseRefItem:
            type: object
            properties:
                x1:
                    type: number
                x2:
                    type: number
                y1:
                    type: number
                y2:
                    type: number

    responses:
      200:
        description: Prediction object
        schema:
          $ref: '#/definitions/Response'
    """
    if palette == 'all':
        result = None
    else:
        result = {}

    return jsonify(result)

app.run(debug=True)