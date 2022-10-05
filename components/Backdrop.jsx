import PropTypes from 'prop-types'
import React from 'react'
import { ThreeDots } from 'react-loader-spinner'

import styles from './Shared.module.scss'

const Backdrop = ({ show }) => (
  <div className={`${styles.backdrop} ${show ? styles.display : styles.hidden}`}>
    <ThreeDots height={200} width={200} color='#ffbd4a' />
  </div>
)

Backdrop.propTypes = {
  show: PropTypes.bool.isRequired,
}

export default Backdrop
