const Application = require('./Application');
const Interview = require('./Interview');
const Document = require('./Document');
const ApplicationNote = require('./ApplicationNote');

Application.hasMany(Interview, { as: 'interviews', foreignKey: 'applicationId' });
Interview.belongsTo(Application, { as: 'application', foreignKey: 'applicationId' });

Application.hasMany(Document, { as: 'documents', foreignKey: 'applicationId' });
Document.belongsTo(Application, { as: 'application', foreignKey: 'applicationId' });

Application.hasMany(ApplicationNote, { as: 'applicationNotes', foreignKey: 'applicationId' });
ApplicationNote.belongsTo(Application, { as: 'application', foreignKey: 'applicationId' });

module.exports = {
  Application,
  Interview,
  Document,
  ApplicationNote
};
