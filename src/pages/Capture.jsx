import { useUnsavedChanges } from '@/context/unsaved.js'
import { useEffect, useState } from 'react'
import { api } from '@/services/api.js'
import {
  ActionForm,
  Brand,
  Empty,
  ErrorNotice,
  Loading,
  PageTitle,
} from '@/components/ui.jsx'
import { ValueInput } from '@/components/SurveyControls.jsx'
import { captureAnswers, isCaptureFieldVisible } from '@/utils/survey.js'

export default function Capture() {
  const [token] = useState(() =>
    new URLSearchParams(window.location.hash.slice(1)).get('token'),
  )
  const [schema, setSchema] = useState(null)
  const [error, setError] = useState(null)
  const [values, setValues] = useState({})
  const [step, setStep] = useState(0)
  const [sent, setSent] = useState(null)
  const markDirty = useUnsavedChanges()
  useEffect(() => { markDirty(!sent && Object.keys(values).length > 0) }, [values, sent, markDirty])
  const [reload, setReload] = useState(0)
  useEffect(() => {
    // The invitation is sent only in the Authorization header and kept in memory.
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    )
    if (!token) return
    const controller = new AbortController()
    api
      .get('/capture/schema', { token, signal: controller.signal })
      .then((result) => setSchema(result.data))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e)
      })
    return () => controller.abort()
  }, [token, reload])
  function setValue(id, value) {
    setValues((old) => {
      const next = { ...old, [id]: value }
      if (id === 'X07' && value?.includes('por_definir'))
        next.X07 = old.X07?.includes('por_definir')
          ? value.filter((v) => v !== 'por_definir')
          : ['por_definir']
      return next
    })
  }
  const groups = [
    'Trayectoria académica',
    'Encuesta de titulados',
    'Contacto y confirmación',
  ]
  const fields =
    schema?.fields.filter((f) => {
      if (!isCaptureFieldVisible(f.id, values)) return false
      return step === 0
        ? f.id.startsWith('X')
        : step === 1
          ? f.id.startsWith('T') && !['T31', 'T32', 'T33', 'T34'].includes(f.id)
          : ['T31', 'T32', 'T33', 'T34'].includes(f.id)
    }) || []
  async function submit() {
    const required = fields.filter(
      (f) =>
        schema.required_fields.includes(f.id) ||
        (f.id === 'X04' &&
          ['empleado', 'independiente', 'emprendimiento'].includes(values.X03)),
    )
    for (const field of required)
      if (
        values[field.id] == null ||
        values[field.id] === '' ||
        (Array.isArray(values[field.id]) && !values[field.id].length)
      )
        throw new Error(`Responde «${field.label}».`)
    if (step === 0 && values.X02 && values.X01 && values.X02 < values.X01)
      throw new Error('El año de titulación no puede preceder al de egreso.')
    if (step < 2) {
      setStep(step + 1)
      window.scrollTo({ top: 0 })
      return
    }
    const answers = captureAnswers(schema.fields, values)
    const { data } = await api.post(
      '/capture/submissions',
      { consent: true, answers },
      { token },
    )
    setSent(data)
  }
  return (
    <main className="capture-shell">
      <header>
        <Brand />
        <span className="muted">Formulario por invitación</span>
      </header>
      {!token ? (
        <Empty title="Se necesita una invitación">
          Abre el enlace privado que te compartió la persona responsable del
          estudio. Si ya lo abriste y recargaste la página, vuelve a usar el
          enlace original.
        </Empty>
      ) : error ? (
        <ErrorNotice
          error={error}
          retry={() => {
            setError(null)
            setReload((v) => v + 1)
          }}
        />
      ) : !schema ? (
        <Loading />
      ) : sent || schema.used ? (
        <Empty title="Tu respuesta fue recibida">
          Gracias por participar en el seguimiento académico. Esta invitación ya
          registró su respuesta.
        </Empty>
      ) : (
        <>
          <PageTitle
            title={groups[step]}
            description="Tus respuestas ayudarán a comprender la trayectoria de los titulados."
          />
          {schema.provisional && (
            <div className="notice">
              Instrumento académico provisional. Los campos con * son
              obligatorios. Puedes dejar las demás preguntas sin respuesta.
            </div>
          )}
          <ol className="capture-steps">
            {groups.map((g, index) => (
              <li
                key={g}
                className={step === index ? 'active' : ''}
                aria-current={step === index ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                {g}
              </li>
            ))}
          </ol>
          <section className="panel padded">
            <ActionForm
              key={step}
              submit={step < 2 ? 'Continuar' : 'Enviar mi respuesta'}
              onSubmit={submit}
            >
              {fields.map((f) => (
                <div className="survey-question" key={f.id}>
                  <span className="question-code">{f.id}</span>
                  <ValueInput
                    field={f}
                    value={values[f.id]}
                    onChange={(v) => setValue(f.id, v)}
                    required={
                      schema.required_fields.includes(f.id) || f.id === 'X04'
                    }
                  />
                </div>
              ))}
              {step === 2 && (
                <>
                  <p>
                    El consentimiento de contacto es opcional. Los datos de
                    contacto se guardan por separado y requieren acceso
                    autorizado.
                  </p>
                  <label className="checkbox-row">
                    <input type="checkbox" required />
                    He revisado mis respuestas y consiento su envío para este
                    estudio académico.
                  </label>
                </>
              )}
              {step > 0 && (
                <button
                  type="button"
                  className="button"
                  onClick={() => setStep(step - 1)}
                >
                  Volver al paso anterior
                </button>
              )}
            </ActionForm>
          </section>
        </>
      )}
      <footer className="app-footer">
        Universidad Mayor de San Simón · Seguimiento académico
      </footer>
    </main>
  )
}
