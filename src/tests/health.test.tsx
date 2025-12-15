
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Unit Test Health Check', () => {
    it('renders correctly', () => {
        render(<div data-testid="test-div">Hello World</div>)
        expect(screen.getByTestId('test-div')).toBeInTheDocument()
    })
})
