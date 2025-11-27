// =================== FUNCIONES AUXILIARES PARA GRÁFICAS ===================

/**
 * Fetch datos de la API con manejo de errores
 */
async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      console.warn(`⚠️ Respuesta API sin éxito: ${data.message}`);
      return null;
    }
    
    return data.data || data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error);
    return null;
  }
}

/**
 * Colores predefinidos para gráficas
 */
const COLORS = {
  primary: '#a12424',
  secondary: '#7c2323',
  tertiary: '#c14444',
  light: '#f5b5b5',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.tertiary,
  COLORS.light,
  COLORS.success,
  COLORS.danger,
  COLORS.warning,
  COLORS.info
];

// =================== INICIALIZACIÓN DE GRÁFICAS ===================

/**
 * Inicializa todas las gráficas cuando el DOM está listo
 */
async function initializeCharts() {
  console.log('📊 Inicializando gráficas...');
  
  try {
    // Obtener todos los datos necesarios en paralelo
    const [
      beneficiariosData,
      montosData,
      areasData,
      sectoresData,
      coloniaData,
      lugarData,
      tipoActividadData,
      evidenciaData,
      solicitudesData,
      procedimientosData,
      fechasData,
      cantidadTemporalData,
      beneficiariesTemporalData,
      montosTemporalData,
      usuariosData
    ] = await Promise.all([
      fetchData('/api/estadisticas/beneficiarios'),
      fetchData('/api/estadisticas/montos'),
      fetchData('/api/estadisticas/areas'),
      fetchData('/api/estadisticas/sectores'),
      fetchData('/api/estadisticas/colonias'),
      fetchData('/api/estadisticas/lugares'),
      fetchData('/api/estadisticas/tipos-actividad'),
      fetchData('/api/estadisticas/evidencia'),
      fetchData('/api/estadisticas/solicitudes'),
      fetchData('/api/estadisticas/procedimientos'),
      fetchData('/api/estadisticas/fechas'),
      fetchData('/api/estadisticas/cantidad-temporal'),
      fetchData('/api/estadisticas/beneficiarios-temporal'),
      fetchData('/api/estadisticas/montos-temporal'),
      fetchData('/api/estadisticas/usuarios')
    ]);
    
    // Crear gráficas con los datos obtenidos
    createBeneficiariosChart(beneficiariosData);
    createMontosChart(montosData);
    createAreasChart(areasData);
    createSectoresChart(sectoresData);
    createColoniaChart(coloniaData);
    createLugarChart(lugarData);
    createTipoActividadChart(tipoActividadData);
    createEvidenciaChart(evidenciaData);
    createSolicitudesChart(solicitudesData);
    createProcedimientosChart(procedimientosData);
    createFechasChart(fechasData);
    createCantidadTemporalChart(cantidadTemporalData);
    createBeneficiariosTemporalChart(beneficiariesTemporalData);
    createMontosTemporalChart(montosTemporalData);
    createUsuariosChart(usuariosData);
    
    console.log('✅ Todas las gráficas creadas exitosamente');
  } catch (error) {
    console.error('❌ Error inicializando gráficas:', error);
  }
}

// =================== FUNCIONES DE CREACIÓN DE GRÁFICAS ===================

/**
 * Gráfica de beneficiarios (barra)
 */
function createBeneficiariosChart(data) {
  const canvas = document.getElementById('graficaBeneficiarios');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de beneficiarios');
    return;
  }
  
  const labels = data.map(item => (item.area_nombre || 'Otro').substring(0, 20));
  const values = data.map(item => item.total_beneficiarios || 0);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Número de beneficiarios',
        data: values,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.secondary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Beneficiarios por Área', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de montos generados por área (bar)
 */
function createMontosChart(data) {
  const canvas = document.getElementById('graficaMontos');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de montos');
    return;
  }
  
  const labels = data.map(item => (item.area_nombre || 'Otro').substring(0, 20));
  const generado = data.map(item => parseFloat(item.total_generado) || 0);
  const invertido = data.map(item => parseFloat(item.total_invertido) || 0);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Monto Generado ($)',
          data: generado,
          backgroundColor: COLORS.success,
          borderColor: COLORS.success,
          borderWidth: 1
        },
        {
          label: 'Monto Invertido ($)',
          data: invertido,
          backgroundColor: COLORS.primary,
          borderColor: COLORS.primary,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#333' } },
        title: { display: true, text: 'Montos Generados e Invertidos por Área', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de informes por área (doughnut)
 */
function createAreasChart(data) {
  const canvas = document.getElementById('graficaAreas');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de áreas');
    return;
  }
  
  const labels = data.map(item => item.area_nombre || 'Sin área');
  const values = data.map(item => item.total || 0);
  
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Informes por Área', color: '#333' }
      }
    }
  });
}

/**
 * Gráfica de sectores beneficiados (barra)
 */
function createSectoresChart(data) {
  const canvas = document.getElementById('graficaSectores');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de sectores');
    return;
  }
  
  const labels = data.map(item => item.sector_beneficia || 'Sin sector').slice(0, 8);
  const values = data.map(item => item.total || 0).slice(0, 8);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Informes por sector',
        data: values,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.secondary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Sectores Beneficiados', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de colonias (barra)
 */
function createColoniaChart(data) {
  const canvas = document.getElementById('graficaColonia');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de colonias');
    return;
  }
  
  const labels = data.map(item => item.colonia_comunidad || 'Sin colonia').slice(0, 8);
  const values = data.map(item => item.total || 0).slice(0, 8);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Informes por colonia',
        data: values,
        backgroundColor: COLORS.tertiary,
        borderColor: COLORS.secondary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Colonias o Comunidades', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de lugares de actividad (barra)
 */
function createLugarChart(data) {
  const canvas = document.getElementById('graficaLugar');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de lugares');
    return;
  }
  
  const labels = data.map(item => item.lugar_actividad || 'Sin lugar').slice(0, 8);
  const values = data.map(item => item.total || 0).slice(0, 8);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Informes por lugar',
        data: values,
        backgroundColor: COLORS.warning,
        borderColor: COLORS.secondary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Lugares de Actividad', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de tipos de actividad (barra)
 */
function createTipoActividadChart(data) {
  const canvas = document.getElementById('graficaTipoActividad');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de tipos de actividad');
    return;
  }
  
  const labels = data.map(item => item.tipo_actividad || 'Sin tipo').slice(0, 8);
  const values = data.map(item => item.total || 0).slice(0, 8);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tipo de actividad',
        data: values,
        backgroundColor: COLORS.info,
        borderColor: COLORS.secondary,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Tipos de Actividades', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de evidencia fotográfica (pie)
 */
function createEvidenciaChart(data) {
  const canvas = document.getElementById('graficaEvidencia');
  if (!canvas) return;
  
  if (!data) {
    console.warn('⚠️ Sin datos para gráfica de evidencia');
    return;
  }
  
  const conEvidencia = data.con_evidencia || 0;
  const sinEvidencia = data.sin_evidencia || 0;
  
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Con evidencia fotográfica', 'Sin evidencia fotográfica'],
      datasets: [{
        data: [conEvidencia, sinEvidencia],
        backgroundColor: [COLORS.success, COLORS.danger],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Evidencia Fotográfica', color: '#333' }
      }
    }
  });
}

/**
 * Gráfica de solicitudes de ciudadanía (pie)
 */
function createSolicitudesChart(data) {
  const canvas = document.getElementById('graficaSolicitudes');
  if (!canvas) return;
  
  if (!data) {
    console.warn('⚠️ Sin datos para gráfica de solicitudes');
    return;
  }
  
  const si = data.si || 0;
  const no = data.no || 0;
  
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Responden a solicitud ciudadana', 'No responden a solicitud ciudadana'],
      datasets: [{
        data: [si, no],
        backgroundColor: [COLORS.primary, COLORS.light],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Solicitudes de Ciudadanía', color: '#333' }
      }
    }
  });
}

/**
 * Gráfica de procedimientos de área (pie)
 */
function createProcedimientosChart(data) {
  const canvas = document.getElementById('graficaProcedimientos');
  if (!canvas) return;
  
  if (!data) {
    console.warn('⚠️ Sin datos para gráfica de procedimientos');
    return;
  }
  
  const si = data.si || 0;
  const no = data.no || 0;
  
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Pertenece a procedimientos', 'No pertenece a procedimientos'],
      datasets: [{
        data: [si, no],
        backgroundColor: [COLORS.success, COLORS.warning],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Procedimientos de Área', color: '#333' }
      }
    }
  });
}

/**
 * Gráfica de informes por fecha/mes (línea)
 */
function createFechasChart(data) {
  const canvas = document.getElementById('graficaFecha');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de fechas');
    return;
  }
  
  const labels = data.map(item => item.mes || item.fecha || 'Sin fecha');
  const values = data.map(item => item.total || 0);
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Informes por mes',
        data: values,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.light,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Informes por Mes', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666' } }
      }
    }
  });
}

/**
 * Gráfica de Cantidad por Año/Mes/Semana (línea con múltiples valores)
 */
function createCantidadTemporalChart(data) {
  const canvas = document.getElementById('graficaCantidadTemporal');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de cantidad temporal');
    return;
  }

  // Agrupar por período: año-mes-semana
  const labels = data.map(item => `${item.año}-${String(item.mes).padStart(2,'0')} (Sem ${item.semana})`);
  const cantidades = data.map(item => item.total_cantidad || 0);
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad por período',
        data: cantidades,
        borderColor: COLORS.info,
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.info,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Cantidad por Año/Mes/Semana', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666', maxRotation: 45, minRotation: 0 } }
      }
    }
  });
}

/**
 * Gráfica de Beneficiarios por Año/Mes/Semana (línea con múltiples valores)
 */
function createBeneficiariosTemporalChart(data) {
  const canvas = document.getElementById('graficaBeneficiariosTemporal');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de beneficiarios temporal');
    return;
  }

  // Agrupar por período: año-mes-semana
  const labels = data.map(item => `${item.año}-${String(item.mes).padStart(2,'0')} (Sem ${item.semana})`);
  const beneficiarios = data.map(item => item.total_beneficiarios || 0);
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Número de beneficiarios por período',
        data: beneficiarios,
        borderColor: COLORS.success,
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.success,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Número de Beneficiarios por Año/Mes/Semana', color: '#333' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666', maxRotation: 45, minRotation: 0 } }
      }
    }
  });
}

/**
 * Gráfica de Montos por Año/Mes/Semana (línea con múltiples valores)
 */
function createMontosTemporalChart(data) {
  const canvas = document.getElementById('graficaMontosTemporalChart');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de montos temporal');
    return;
  }

  // Agrupar por período: año-mes-semana
  const labels = data.map(item => `${item.año}-${String(item.mes).padStart(2,'0')} (Sem ${item.semana})`);
  const montos = data.map(item => parseFloat(item.total_generado) || 0);
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Monto generado por período ($)',
        data: montos,
        borderColor: COLORS.danger,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLORS.danger,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#333' } },
        title: { display: true, text: 'Monto Generado por Año/Mes/Semana', color: '#333' },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '$' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#666' } },
        x: { ticks: { color: '#666', maxRotation: 45, minRotation: 0 } }
      }
    }
  });
}

/**
 * Gráfica de Usuarios (Capturistas) con estadísticas de informes
 */
function createUsuariosChart(data) {
  const canvas = document.getElementById('graficaUsuarios');
  if (!canvas) return;
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin datos para gráfica de usuarios');
    return;
  }

  // Extraer datos: nombres de usuarios y sus informes por estado
  const labels = data.map(item => item.usuario_nombre || 'Desconocido');
  const enviados = data.map(item => item.enviados || 0);
  const aprobados = data.map(item => item.aprobados || 0);
  const rechazados = data.map(item => item.rechazados || 0);
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Informes Enviados',
          data: enviados,
          backgroundColor: COLORS.info,
          borderColor: COLORS.info,
          borderWidth: 1
        },
        {
          label: 'Informes Aprobados',
          data: aprobados,
          backgroundColor: COLORS.success,
          borderColor: COLORS.success,
          borderWidth: 1
        },
        {
          label: 'Informes Rechazados',
          data: rechazados,
          backgroundColor: COLORS.danger,
          borderColor: COLORS.danger,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y', // Barras horizontales
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: { color: '#333', padding: 15 } 
        },
        title: { 
          display: true, 
          text: 'Actividad de Capturistas por Estado de Informe', 
          color: '#333',
          font: { size: 14, weight: 'bold' }
        }
      },
      scales: {
        x: { 
          stacked: false,
          beginAtZero: true, 
          ticks: { color: '#666' } 
        },
        y: { 
          ticks: { color: '#666' } 
        }
      }
    }
  });
}

// =================== EVENT LISTENERS ===================

// Inicializar gráficas cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM Cargado - Iniciando gráficas...');
  initializeCharts();
});

// Alternative: si Chart.js no está cargado aún, esperar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCharts);
} else {
  initializeCharts();
}
